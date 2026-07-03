import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { liveEventSchema, liveStreamSchema } from "../schemas/index.js";

// GET all live events
export const getLiveEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.liveEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        streams: true,
      }
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching live events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET single live event
export const getLiveEvent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const event = await prisma.liveEvent.findUnique({
      where: { id },
      include: {
        streams: true,
      }
    });
    
    if (!event) {
       res.status(404).json({ error: "Event not found" });
       return;
    }
    
    res.json(event);
  } catch (error) {
    console.error("Error fetching live event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST create live event (Admin)
export const createLiveEvent = async (req: Request, res: Response) => {
  try {
    const validatedData = liveEventSchema.parse(req.body);
    
    const event = await prisma.liveEvent.create({
      data: validatedData,
    });
    
    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.name === "ZodError") {
       res.status(400).json({ error: error.errors });
       return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT update live event (Admin)
export const updateLiveEvent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = liveEventSchema.parse(req.body);
    
    const event = await prisma.liveEvent.update({
      where: { id },
      data: validatedData,
    });
    
    res.json(event);
  } catch (error: any) {
    console.error("Error updating event:", error);
    if (error.name === "ZodError") {
       res.status(400).json({ error: error.errors });
       return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE live event (Admin)
export const deleteLiveEvent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.liveEvent.delete({
      where: { id },
    });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST add stream to event (Admin)
export const addStreamToEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string;
    const validatedData = liveStreamSchema.parse(req.body);
    
    const stream = await prisma.liveStream.create({
      data: {
        ...validatedData,
        eventId,
      },
    });
    
    res.status(201).json(stream);
  } catch (error: any) {
    console.error("Error adding stream:", error);
    if (error.name === "ZodError") {
       res.status(400).json({ error: error.errors });
       return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE stream (Admin)
export const deleteStream = async (req: Request, res: Response) => {
  try {
    const streamId = req.params.streamId as string;
    await prisma.liveStream.delete({
      where: { id: streamId },
    });
    res.json({ message: "Stream deleted successfully" });
  } catch (error) {
    console.error("Error deleting stream:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
