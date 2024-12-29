const express = require("express");
import { NextFunction, Request, Response } from "express";
import { JWT_PASSWORD } from "../config";
const jwt = require("jsonwebtoken");

const userMiddleWare = (req : Request,res : Response,next : NextFunction)=>{
    const header = req.headers["authorization"];
    const token = header?.split(" ")[1];
    // console.log(token + " this is a token")
    if(!token || token === "undefined"){
        // console.log("No token")
        res.status(403).json({
            message : "No token provided"
        })
        return
    }
    try{
        const decoded = jwt.verify(token,JWT_PASSWORD) as { userId: string , role  : string };
        
        req.userId = decoded.userId;
        // console.log("userId inside middleware " + req.userId)
        next()
    }catch(e){
        console.log("Something went wrong here")
        console.log(e)
        res.status(403).json({
            message : "Invalid token"
        })
        return
    }
}

export default userMiddleWare;