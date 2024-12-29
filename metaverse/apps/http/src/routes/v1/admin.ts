import { Router } from "express";
import adminMiddleware from "../../middleware/adminMiddleWare";
import { prisma } from "@repo/db/client";
import { CreateAvatarSchema, CreateElementSchema, CreateMapSchema } from "../../types";

const adminRouter = Router();
const client = new prisma.PrismaClient();
adminRouter.use(adminMiddleware)

adminRouter.post("/element",async (req,res)=>{
    const parsedData = CreateElementSchema.safeParse(req.body);
    if(!parsedData.success){
        // console.log("Error occured")
        res.status(400).json({
            message : "Validation failed"
        })
        return
    }
    try{
        const element = await client.element.create({
            data : {
            imageUrl : parsedData.data.imageUrl,
            width : parsedData.data.width,
            height : parsedData.data.height,
            static : parsedData.data.static
            }
        })
        // console.log("element created")
        // console.log(element)
        res.status(200).json({
            id : element.id

        })
    }catch(e){
        // console.log(e).

        res.status(400).json({
            message : "Invalid request"
        })
    }

})

adminRouter.put("/element/:elementId",async (req,res)=>{
    const elementId = req.params.elementId;
    const imageUrl = req.body.imageUrl;
    try{
        const element = await client.element.update({
            where : {
                id : elementId
            },
            data : {
                imageUrl : imageUrl,
               
            }
        })

        res.json({
            id : element.id
        })
    }catch(e){
        res.status(400).json({
            message : "Invalid request"
        })
    }
})

adminRouter.post("/avatar",async (req,res)=>{
    const parsedData = CreateAvatarSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message : "Validation failed"
        })
        return
    }
    try{
        const avatar = await client.avatar.create({
            data : {
                imageUrl : parsedData.data.imageUrl,
                name : parsedData.data.name
            }
        })
        // console.log("avatar created");
        res.status(200).json({
            id : avatar.id
        })
    }catch(e){
        console.log(e)
        res.status(400).json({
            message : "Invalid request"
        })
    }

})

adminRouter.post("/map",async (req,res)=>{
    const parsedData = CreateMapSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message : "Validation failed"
        })
        return
    }
    try{
        const width =  parseInt(parsedData.data.dimensions.split("x")[0]);
        const height = parseInt(parsedData.data.dimensions.split("x")[1]);
        
        const map = await client.map.create({
            data : {
                name : parsedData.data.name,
                width : width,
                thumbnail : parsedData.data.thumbnail,
                height : height,
                elements : {
                    create: parsedData.data.defaultElements.map((e : any) => ({
                    elementId: e.elementId,
                    x: e.x,
                    y: e.y
                }))
            }
            }
        })
        // console.log("map created")
        res.status(200).json({
            id : map.id
        })
    }catch(e){
        // console.log(e)
        res.status(400).json({
            message : "Invalid request"
        })
    }

})

export default adminRouter;