import { Router } from "express";
import { prisma } from "@repo/db/client";
import {
  CreateSpaceSchema,
  AddElementSchema,
  DeleteElementSchema,
} from "../../types";
import userMiddleWare from "../../middleware/userMiddleWare";
import { any } from "zod";

const client = new prisma.PrismaClient();

const spaceRouter = Router();

spaceRouter.post("/", userMiddleWare, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Validation Failed",
    });
    return;
  }

  if (!parsedData.data.mapId) {
    const width = parseInt(parsedData.data.dimensions.split("x")[0]);
    const height = parseInt(parsedData.data.dimensions.split("x")[1]);
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        height: height,
        width: width,
        userId: req.userId!,
      },
    });

    res.json({
      spaceId: space.id,
    });
    return;
  }
  try {
    const map = await client.map.findFirst({
      where: {
        id: parsedData.data.mapId,
      },
      select: {
        elements: true,
        width: true,
        height: true,
      },
    });

    if (!map) {
      res.status(400).json({
        message: "Map not found",
      });
      return;
    }

    let spaceTransaction = await client.$transaction(async () => {
      const space = await client.space.create({
        data: {
          name: parsedData.data.name,
          width: map.width,
          height: map.height,

          userId: req.userId!,
        },
      });
      await client.spaceElements.createMany({
        data: map.elements.map((e) => ({
          spaceId: space.id,
          elementId: e.elementId,
          x: e.x!,
          y: e.y!,
        })),
      });

      return space;
    });
    res.json({
      spaceId: spaceTransaction.id,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "Space already exists",
    });
  }
});
spaceRouter.delete("/element", userMiddleWare, async (req, res) => {
  //   console.log("spaceElement?.space1 ");
  console.log("you are inside delete element router");
  const parsedData = DeleteElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log(parsedData.error.issues[0]);
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  console.log("hi you are here");
  try {
    const spaceElement = await client.spaceElements.findFirst({
      where: {
        id: parsedData.data.id,
      },
      include: {
        space: true,
      },
    });
    console.log("All space elements " + spaceElement?.space.elements);
    console.log(spaceElement?.space.userId)
    if (
      !spaceElement?.space.userId ||
      spaceElement.space.userId !== req.userId
    ) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    await client.spaceElements.delete({
      where: {
        id: parsedData.data.id,
      },
    });
    res.json({ message: "Element deleted" });
    console.log("deleted");
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "Invalid request",
    });
  }
});

spaceRouter.delete("/:spaceId", userMiddleWare, async (req, res) => {
  const spaceId = req.params.spaceId;

  try {
    const space = await client.space.findFirst({
      where: {
        id: spaceId,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    console.log(" you are inside sspace delete" + space.userId);
    // console.log(space)
    if (!space) {
      res.status(400).json({
        message: "Space not found",
      });
      return;
    }
    console.log("space user "+ space.userId)
    console.log("req user " + req.userId)
    if (space.userId !== req.userId) {
      // console.log(space.userId)
      // console.log(req.userId)
      console.log("Not an owner")
      res.status(403).json({
        message: "You are not the owner of this space",
      });
      return;
    }
    await client.space.delete({
      where: {
        id: spaceId,
      },
    });
    // console.log("space deleted")
    res.json({
      message: "Space deleted successfully",
    });
  } catch (e) {
    // console.log(e)
    res.status(400).json({
      message: "Invalid request",
    });
  }
});

spaceRouter.get("/all", userMiddleWare, async (req, res) => {
  try {
    const spaces = await client.space.findMany({
      where: {
        userId: req.userId,
      },
    });
    // console.log(spaces)
    res.json({
      spaces: spaces.map((s: any) => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail,
        dimensions: `${s.width}x${s.height}`,
      })),
    });
  } catch (e) {
    res.status(400).json({
      message: "Invalid request",
    });
    return;
  }
});

spaceRouter.get("/:spaceId", userMiddleWare, async (req, res) => {
  const spaceId = req.params.spaceId;
  try {
    const space = await client.space.findFirst({
      where: {
        id: spaceId,
      },
      include: {
        elements: {
          include: {
            element: true,
          },
        },
      },
    });
    if (!space) {
      res.status(400).json({
        message: "Space not found",
      });
      return;
    }

    res.json({
      dimensions: `${space.width}x${space.height}`,
      elements: space.elements.map((e) => ({
        id: e.id,
        element: {
          id: e.element.id,
          imageUrl: e.element.imageUrl,
          width: e.element.width,
          height: e.element.height,
          static: e.element.static,
        },
        x: e.x,
        y: e.y,
      })),
    });
  } catch (e) {
    res.status(400).json({
      message: "Invalid request",
    });
    return;
  }
});

//Add an element to a space
spaceRouter.post("/element", userMiddleWare, async (req, res) => {
  console.log("you are inside add element router");
  const parsedData = AddElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Validation failed",
    });
    return;
  }
  try {
    const space = await client.space.findUnique({
      where: {
        id: parsedData.data.spaceId,
        userId: req.userId!,
      },
      select: {
        width: true,
        height: true,
      },
    });

    console.log("Trying to find space");
    if (!space) {
      console.log("You are here");
      res.status(400).json({
        message: "Space not found",
      });
      return;
    }

    if (
      req.body.x < 0 ||
      req.body.y < 0 ||
      req.body.x > space?.width! ||
      req.body.y > space?.height!
    ) {
      res.status(400).json({ message: "Point is outside of the boundary" });
      return;
    }

    const element = await client.element.findFirst({
      where: {
        id: parsedData.data.elementId,
      },
    });

    if (!element) {
      res.status(400).json({
        message: "Element not found",
      });
      return;
    }
    await client.spaceElements.create({
      data: {
        spaceId: parsedData.data.spaceId,
        elementId: parsedData.data.elementId,
        x: parsedData.data.x,
        y: parsedData.data.y,
      },
    });
    res.json({
      message: "Element added successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "Invalid request",
    });
  }
});

export default spaceRouter;
