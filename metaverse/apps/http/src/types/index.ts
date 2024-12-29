const z = require("zod");

export const SignupSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
  type: z.string()
});

export const SigninSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
});


export const UpdateMetadataSchema = z.object({
    avatarId: z.string()
})

export const CreateSpaceSchema  = z.object(
    {
        name :  z.string(),
        dimensions : z.string().regex(/^[0-9]+x[0-9]+$/),
        mapId : z.string().optional()
    }
)

export const AddElementSchema = z.object(
    {
        spaceId : z.string(),
        elementId : z.string(),
        x : z.number(),
        y : z.number()
    }
)

export const CreateElementSchema = z.object({
    imageUrl : z.string().url(),
    width : z.number(),
    height : z.number(),
    static : z.boolean()
}
)

export const DeleteElementSchema = z.object({
    id : z.string()
})

export const UpdateElementSchema = z.object({
    imageUrl : z.string().url(),
})

export const CreateAvatarSchema = z.object({
    imageUrl : z.string().url(),
    name : z.string()
})

export const CreateMapSchema = z.object({
    thumbnail : z.string().url(),
    name: z.string(),
    dimensions : z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    defaultElements: z.array(z.object(
       {
        elementId : z.string(),
        x : z.number(),
        y : z.number()
        
       }
    ))
})


declare global {
    namespace Express {
      interface Request {
        userId?: string;
      }
    }
  }
