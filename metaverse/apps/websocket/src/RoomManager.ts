
import { outGoingMessage } from "./types";
import {User} from "./User";

export class RoomManager {
   rooms: Map<string, User[]> = new Map();
    static instance  : RoomManager;
    
    constructor() { 
        this.rooms = new Map();
    }  
    static getInstance(){
        if(!this.instance){     
                this.instance = new RoomManager();
            }
        return this.instance;
    } 
    public removeUser(user: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) {
            return;
        }
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []));
    }

    public addUser(spaceId: string, user: User) {
        if (!this.rooms.has(spaceId)) {
            this.rooms.set(spaceId, [user]);
            return;
        }
        this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
    }

    public broadcast(spaceId: string, message: outGoingMessage, user : User) {
        if(this.rooms.has(spaceId)) {  
            console.log("broadcasting to " + this.rooms.get(spaceId)?.length)
            this.rooms.get(spaceId)?.forEach((u) => {
                if (u.id !== user.id) {
                    u.send(message);
                    console.log("sent to " + u.id)
                }
             
            });
        }
    }
}