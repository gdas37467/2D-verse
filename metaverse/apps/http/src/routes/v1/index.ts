import { Router } from "express";
import {prisma} from "@repo/db/client";
import { SigninSchema, SignupSchema } from "../../types";
import { JWT_PASSWORD } from "../../config";
import {hash,compare} from "../../scrypt";
import userRouter from "./user";
import adminRouter from "./admin";
import spaceRouter from "./space";
const jwtToken = require("jsonwebtoken");



const router = Router();

const client = new prisma.PrismaClient();

router.post("/signup",async (req,res)=>{
    const parsedData = SignupSchema.safeParse(req.body);
   
    if(!parsedData.success){
        res.status(400).json({
            message : parsedData.error.issues[0].message
        })
        return
    }
    // console.log("Hi")
    const hashedPassword = await hash(parsedData.data.password);
    try{
        const user = await client.user.create({
            data : {
                username : parsedData.data.username,
                password : hashedPassword,
                role  : parsedData.data.type == "admin"? "Admin" : "User"
            }
        })
        res.json({
            userId : user.id,
        })
        return
    }catch(e)
    {
        console.log("UserName already exists")
        res.status(400).json({  
            message : "Username already exists"
        })
        return
       
    }
   
    
})

router.post("/signin",async (req,res)=>{
   const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message : parsedData.error.issues[0].message
        })
        return
    }
    
       const user = await client.user.findUnique({
           where : {
               username : parsedData.data.username
           }
       })
       if(!user){
           res.status(403).json({
               message : "Username not found"
           })
           return
       }
       const isPasswordCorrect = await compare(parsedData.data.password,user.password);


       if(!isPasswordCorrect){
           res.status(403).json({
               message : "Incorrect password"
           })
           return
       }
       const token = jwtToken.sign({
           userId : user.id,
           role : user.role
       },JWT_PASSWORD)

       res.json({
           token
       })
       return
})

router.get("/avatars",async (req,res)=>{

    const avatars = await client.avatar.findMany();
    res.json({
        "avatars" : avatars
    });
    console.log(avatars)
}
)

router.get("/elements",async (req,res)=>{  
    try{
        const elements = await client.element.findMany();
        res.json({elements: elements.map(e => ({
            id: e.id,
            imageUrl: e.imageUrl,
            width: e.width,
            height: e.height,
            static: e.static
        }))})
    }catch(e){
        res.status(400).json({
            message : "Invalid request"
        })
    }
 })

    

router.use("/user",userRouter);
router.use("/admin",adminRouter);
router.use("/space",spaceRouter);

export default router;