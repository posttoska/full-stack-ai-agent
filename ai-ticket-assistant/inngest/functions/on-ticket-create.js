import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js"
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";


export const onTicketCreated = inngest.createFunction(
    { id: "on-ticket-created", retries: 2},
    { event: "ticket/created" },

    async ({event, step}) => {
        try {
            const {ticketId} = event.data

            //fetch ticket from DB
            const ticket = await step.run("fetch-ticket", async () => {
                const ticketObject = await Ticket.findById(ticketId);
                if (!ticket) {
                    throw new NonRetriableError("Ticket not found");
                }
                return ticketObject
            })

            await step.run("update-ticket-status", async () => {
                await Ticket.findByIdAndUpdate(ticket._id, {
                status: "TODO"})
            })

            const aiResponse = await analyzeTicket(ticket)

            const relatedskills = await step.run("ai-processing", async () => {
                let skills = []

                if(aiResponse) {
                    await Ticket.findByIdAndUpdate(ticket._id, {
                        priority: !["low", "medium", "high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
                        helpfulNotes: aiResponse.helpfulNotes,
                        status: "IN_PROGRESS",
                        relatedSkills: aiResponse.relatedSkills
                    })
                    skills = aiResponse.relatedSkills
                }
                return skills
            })

            // find moderator user
            const moderator = await step.run("assign-moderator", async () => {
                let user = await User.findOne({
                    role: "moderator",
                    skills: {
                        $elemMatch: {
                            $regex: relatedskills.join(" | "),
                            $options: "i"
                        },
                    },
                });

                // in case moderator user not found
                if(!user) {
                    user = await User.findOne({
                        role: "admin"
                    })
                }

                // assign ticket to selected user
                await Ticket.findByIdAndUpdate(ticket._id, {
                    assignedTo: user?._id || null
                })

                return user
            });

            // send email
            await step.run("send-email-notification", async () => {

                if(moderator) {

                    const finalTicket = await Ticket.findById(ticket._id)
                    
                    await sendMail(
                        moderator.email,
                        "Ticket assigned",
                        `A new ticket assigned to you ${finalTicket.title}`
                    )
                }
            })

            return {success: true}

        } catch (err) {
            console.error("Error running the step", err.message)
            return {success: false}
    }
}

);