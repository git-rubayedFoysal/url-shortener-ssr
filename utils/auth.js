import fs from "node:fs/promises";
import path from "node:path";

export const setSession = async (sessionId, user) => {
  try {
    const filePath = path.resolve("sessions", `${sessionId}.txt`);

    const newFile = await fs.open(filePath, "wx");

    await newFile.writeFile(JSON.stringify(user));

    await newFile.close();

    return true;
  } catch (error) {
    return false;
  }
};

export const getSession = async (sessionId) => {
  try {
    const filePath = path.resolve("sessions", `${sessionId}.txt`);

    const file = await fs.open(filePath, "r");

    const data = await file.readFile("utf8");

    await file.close();

    return JSON.parse(data);
  } catch (error) {
    return false;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const filePath = path.resolve("sessions", `${sessionId}.txt`);

    await fs.unlink(filePath);

    return true;
  } catch (error) {
    return false;
  }
};
