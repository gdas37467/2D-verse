const express = require("express");
import { NextFunction, Request, Response } from "express";
import { JWT_PASSWORD } from "../config";
const jwt = require("jsonwebtoken");


const adminMiddleWare = (req : Request,res : Response,next : NextFunction)=>{

    const header = req.headers["authorization"];
    const token = header?.split(" ")[1];
    if(!token){
        res.status(403).json({
            message : "No token provided"
        })
        return
    }
    try{
        const decoded = jwt.verify(token,JWT_PASSWORD) as { userId: string , role  : string };
        if(decoded.role !== "Admin"){
            // console.log("not an admin")
            res.status(403).json({
                
                message : "User is not authorized to access this endpoint"
            })
            return
        }
        req.userId = decoded.userId;
        next()
    }catch(e){
        res.status(403).json({
            message : "Invalid token"
        })
        return
    }
}

export default adminMiddleWare;