

import { randomUUID } from 'crypto';
import { outGoingMessage } from './types';
import WebSocket from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from './config';
import { prisma } from "@repo/db/client";
import {RoomManager} from './RoomManager';
export  class User{

    public id : string;
    public userId : string;
    private spaceId? : string;
    private x : number;
    private y : number;
    private ws : WebSocket;



    constructor(ws : WebSocket) {
        this.id = randomUUID();;
        
        this.x = 0;
        this.y = 0;
        this.ws = ws;
        this.initHandler();
    }

    initHandler(){
        this.ws.on('message',async (data) =>{
            const parsedData = JSON.parse(data.toString());
            if(parsedData.type === 'join'){
                const spaceId = parsedData.payload.spaceId;
                const token = parsedData.payload.token;
                const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId
                this.userId = userId;
                const client = new prisma.PrismaClient();
                if (!userId) {
                    this.ws.close()
                    return
                }
                
                this.userId = userId
                console.log( "userId"  +  this.userId)
                const space = await client.space.findFirst({
                    where: {
                        id: spaceId
                    }
                })
               
                if (!space) {
                    this.ws.close()
                    return;
                }
                
                this.spaceId = spaceId
                console.log("space " + spaceId)
                RoomManager.getInstance().addUser(spaceId, this);
                this.x = Math.floor(Math.random() * space?.width);
                this.y  = Math.floor(Math.random() * space?.height);
                console.log("spawned at x " + this.x)
                console.log("spawned at y " + this.y)
                this.send({
                    type: "space-joined",
                    payload: {
                        spawn: {
                            x: this.x,
                            y: this.y
                        },
                        users: RoomManager.getInstance().rooms.get(spaceId)?.filter(x => x.id !== this.id)?.map((u) => ({id: u.id})) ?? []
                    }
                })
                RoomManager.getInstance().broadcast(this.spaceId!,{
                    type: "user-joined",
                    payload: {
                        userId: this.userId,
                        x: this.x,
                        y: this.y
                    }
                }
                , this);
                console.log("user joined")
            
                


            }else if(parsedData.type === 'move'){
                const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    const xDisplacement = Math.abs(this.x - moveX);
                    const yDisplacement = Math.abs(this.y - moveY);
                    if ((xDisplacement == 1 && yDisplacement== 0) || (xDisplacement == 0 && yDisplacement == 1)) {
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast( this.spaceId!,{
                            type: "movement",
                            payload: {
                                x: this.x,
                                y: this.y
                            }
                        }, this);
                        return;
                    }
                    
                    this.send({
                        type: "movement-rejected",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    });
                 
            }
            
        })
    }
    destroy() {
        RoomManager.getInstance().broadcast(this.spaceId!,{
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this);
        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }

    send(payLoad : outGoingMessage) {
        this.ws.send(JSON.stringify(payLoad));
    }

}