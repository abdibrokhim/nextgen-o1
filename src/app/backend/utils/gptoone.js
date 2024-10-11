// import { openDatabase, getTextFromIndexedDB } from "./indexdb.js";
// 
export const gptoOne = async (prompt, sP) => {
    console.log("loading gptoOne...");

    const systemPrompt = sP?? "You are a helpful assistant that provides useful information to people in need. Given the text below, please make it short and concise. If it has any links, please align them very well.";

    try {
        const response = await fetch("https://api.aimlapi.com/chat/completions", {
            method: "POST",
            headers: {
                Authorization: "Bearer ",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: systemPrompt+"\n\n"+prompt,
                    },
                ],
                max_tokens: 512,
            }),
        });

        const data = await response.json();

        console.log("data: ", data);

        console.log("data.choices[0].message.content: ", data.choices[0].message.content);

        // Return the assistant's message content
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching the data:", error);
        return "An error occurred while fetching the data.";
    }
}


// const getSystemPromptFromLocalStorage = () => {
//     const systemPrompt = localStorage.getItem("systemPrompt");
//     return systemPrompt ? systemPrompt : "You are a helpful assistant that provides useful information to people in need. Given the text below, please make ";
// }

// sample usage

// gptoOne("Nobel Prize 2024 Physics").then(console.log);

// You are a helpful assistant that provides useful information to people in need. Given the text below, please make it as story for 10 year old child. If it has any links, please align them very well.

// Tell me about Deep Learning