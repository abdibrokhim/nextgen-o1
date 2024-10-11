import { WebBrowser } from "langchain/tools/webbrowser";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

export const webBrowser = async (searchQuery) => {
    console.log("loading webBrowser...");

  const model = new ChatOpenAI({ 
    apiKey: "",
    model: "gpt-4o",
    temperature: 0 
    });

    const embeddings = new OpenAIEmbeddings({
        apiKey: "",
        batchSize: 512,
        model: "text-embedding-3-large",
      });

  const browser = new WebBrowser({ model, embeddings });

  const result = await browser.invoke(
    `"https://www.nobelprize.org/all-nobel-prizes-2024/","${searchQuery}"`
  );

  console.log('webAnswer: ', result);
  return result;
}