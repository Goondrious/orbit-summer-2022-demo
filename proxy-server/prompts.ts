import express, { Express, Request, Response } from "express";
import promptJSON, { PromptConfig } from "./prompt-data";

const app: Express = express();

// dummy with local data for now
export const getStoredPromptConfig = (
  url: string,
): PromptConfig | undefined => {
  try {
    const json = promptJSON[url];
    return json;
  } catch (e) {
    console.warn("Error parsing local json:", e);
    return;
  }
};

const getStoredPrompts = async (url: string) => {
  try {
    const json = promptJSON[url]?.prompts;
    return json;
  } catch (e) {
    console.warn("Error parsing local json:", e);
    return;
  }
};

const getStoredPromptLists = async (url: string) => {
  try {
    const json = promptJSON[url]?.promptLists;
    return json;
  } catch (e) {
    console.warn("Error parsing local json:", e);
    return;
  }
};

app.get("/config/*", async (req: Request, res: Response) => {
  const reqURL = req.params[0];
  if (!reqURL)
    return res
      .status(400)
      .json({ message: "A valid url is required for prompt data" });

  const localJson = await getStoredPromptConfig(reqURL);

  return res.status(200).send({ config: localJson });
});

app.get("/page/*", async (req: Request, res: Response) => {
  const reqURL = req.params[0];
  if (!reqURL)
    return res
      .status(400)
      .json({ message: "A valid url is required for prompt data" });

  const localJson = await getStoredPrompts(reqURL);

  return res.status(200).send({ prompts: localJson });
});

app.get("/inline/*", async (req: Request, res: Response) => {
  const reqURL = req.params[0];
  if (!reqURL)
    return res
      .status(400)
      .json({ message: "A valid url is required for prompt lists data" });

  const localJson = await getStoredPromptLists(reqURL);

  return res.status(200).send({ promptLists: localJson });
});

export default app;
