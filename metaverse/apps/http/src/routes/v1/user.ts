import { Router } from "express";
import userMiddleware from "../../middleware/userMiddleWare";
import { prisma } from "@repo/db/client";
import { UpdateMetadataSchema } from "../../types";
const userRouter = Router();
const client = new prisma.PrismaClient();



userRouter.post("/metadata", userMiddleware, async (req, res) => {
  console.log(req.body)
  const parsedData = UpdateMetadataSchema.safeParse(req.body)   
  console.log(parsedData)
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        console.log(parsedData.error.issues[0])
        res.status(400).json({message: "Validation failed"})
        return
    }
    try {
        await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                avatarId: parsedData.data.avatarId
            }
        })
        console.log("hi")
        res.json({message: "Metadata updated"})
       
    } catch(e) {
        console.log(e)
        res.status(400).json({message: "Internal server error"})
        return
    }
});

userRouter.get("/metadata/bulk",async (req, res) => {
                                                                                                                                                                                                                                                                                                                                                                                                                          
  const userIdString = (req.query.ids ?? "[]") as string;
  const userIds = (userIdString).slice(1, userIdString?.length - 1).split(",");
  console.log(userIds)
   
    try {
      const metadata = await client.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
      console.log(metadata)
      res.json({
        avatars: metadata.map(m => ({
          userId: m.id,
          avatarId: m.avatar?.imageUrl
      })),
      });
    } catch (e) {
      console.log(e)
      res.status(400).json({
        message: "Invalid request",
      });
    }
  }
)

export default userRouter;
