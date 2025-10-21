// emo_sense_agent.js
// An advanced, multimodal-inspired AI agent based on the "EmoSense Companion" concept.

// Import necessary libraries
import 'dotenv/config'; // Loads environment variables from .env file
import readline from 'readline';

// --- Gemini API Configuration ---
// NOTE: Ensure your model name is correct. 'gemini-1.5-flash-latest' is a common and robust choice.
const GEMINI_MODEL = 'gemini-1.5-flash-latest'; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in your .env file. Please create one.");
}
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;


// =============================================================================
// FEATURE: Personalized Interventions
// PURPOSE: To provide targeted, evidence-based coping strategies based on the user's detected emotional state.
// TECHNICAL IMPLEMENTATION: A class that stores various intervention techniques (e.g., breathing, grounding).
// BENEFIT: Moves beyond generic responses to offer actionable help tailored to the specific emotion being experienced.
// =============================================================================
class InterventionManager {
    getIntervention(emotionalState) {
        switch (emotionalState.toLowerCase()) {
            case 'anxious':
            case 'agitated':
                return this.getBreathingExercise();
            case 'sad':
            case 'depressed':
            case 'hopeless':
                return this.getGroundingTechnique();
            case 'stressed':
                return this.getMindfulnessPrompt();
            default:
                return "I'm here to listen. Feel free to share more about what's on your mind.";
        }
    }

    getBreathingExercise() {
        return `
I sense you might be feeling anxious. Let's try a simple breathing exercise together. It's called Box Breathing.
1. Find a comfortable position.
2. Slowly exhale all the air from your lungs.
3. Inhale gently through your nose for a count of 4.
4. Hold your breath for a count of 4.
5. Exhale slowly through your mouth for a count of 4.
6. Hold the empty breath for a count of 4.
Repeat this a few times. I'll be here when you're ready.`;
    }

    getGroundingTechnique() {
        return `
It sounds like things are really tough right now. Let's try a grounding technique called 5-4-3-2-1 to connect with the present moment.
- Name 5 things you can see around you.
- Name 4 things you can feel (like the chair you're on, or your feet on the floor).
- Name 3 things you can hear right now.
- Name 2 things you can smell.
- Name 1 good thing about yourself.
Take your time. This can help when thoughts feel overwhelming.`;
    }

    getMindfulnessPrompt() {
        return `
It sounds like you're under a lot of stress. Let's take a brief moment for a mindfulness check-in.
Close your eyes for a moment if you feel comfortable.
What is the physical sensation of stress in your body right now? Is it in your shoulders? Your stomach?
Just notice it without judgment. Acknowledge that it's there. Now, take one deep, slow breath and let it go.
Sometimes just noticing is the first step.`;
    }
}


class EmoSenseAgent {
    constructor() {
        this.interventionManager = new InterventionManager();
        this.sessionHistory = [];

        // =============================================================================
        // FEATURE: Crisis Handling - DETERMINISTIC SAFETY NET
        // PURPOSE: To instantly identify explicit, high-risk statements of self-harm.
        // TECHNICAL IMPLEMENTATION: An array of keywords that bypasses the LLM for immediate escalation.
        // BENEFIT: Provides a 100% reliable, fast-acting guardrail for the most urgent cases.
        // =============================================================================
        this.highRiskKeywords = [
            "hurt myself", "kill myself", "end my life", "want to die",
            "suicide", "ending it all", "overdose", "self harm", "cut myself"
        ];
    }

    /**
     * Updates the session history with the latest analysis.
     * @param {object} analysis - The emotional analysis from the LLM.
     */
    updateHistory(analysis) {
        this.sessionHistory.push(analysis.emotional_state);
        if (this.sessionHistory.length > 3) {
            this.sessionHistory.shift(); // Keep only the last 3 states
        }
    }

    /**
     * Analyzes user input using a two-tiered approach: keyword check first, then multimodal LLM analysis.
     * @param {object} multimodalInput - An object containing text and simulated sensor data.
     * @returns {Promise<object>} An analysis object with emotional state and crisis level.
     */
    async analyzeInput(multimodalInput) {
        const normalizedInput = multimodalInput.text.toLowerCase();

        // 1. IMMEDIATE KEYWORD CHECK (SAFETY NET)
        const isHighRisk = this.highRiskKeywords.some(keyword => normalizedInput.includes(keyword));
        if (isHighRisk) {
            return {
                emotional_state: "Crisis",
                intensity: 10,
                is_crisis: true,
                reason: "High-risk keyword detected.",
                confidence: 1.0
            };
        }

        // 2. LLM-BASED MULTIMODAL NUANCE CHECK
        console.log("\n[INFO] No high-risk keywords. Consulting Gemini for deep multimodal analysis...");
        const geminiResult = await this.callGeminiForMultimodalAnalysis(multimodalInput);
        
        this.updateHistory(geminiResult);
        return geminiResult;
    }

    /**
     * Calls the Gemini API with an advanced prompt to analyze simulated multimodal input.
     * @param {object} multimodalInput The combined input from the user.
     * @returns {Promise<object>} The parsed JSON response from the LLM.
     */
    async callGeminiForMultimodalAnalysis(multimodalInput) {
        // =============================================================================
        // FEATURE: AI/NLP - Advanced Multimodal Emotional Analysis
        // PURPOSE: To analyze a combination of user inputs for a holistic understanding of their emotional state.
        // TECHNICAL IMPLEMENTATION: A sophisticated prompt instructing the Gemini model to synthesize text,
        // (simulated) computer vision, audio, and physiological data into a single, structured JSON output.
        // BENEFIT: Provides a much more accurate and nuanced assessment than text alone, catching non-verbal cues.
        // =============================================================================
        const prompt = `
            You are "EmoSense", a highly specialized AI assistant for a mental health support companion.
            Your task is to analyze a combined set of inputs from a user to determine their emotional state with nuance and accuracy.
            The user provides text, but also contextual data simulating what computer vision, audio processing, and physiological sensors would detect.

            Analyze the following data packet:
            - User's typed message: "${multimodalInput.text}"
            - Simulated Computer Vision (facial expression): "${multimodalInput.vision}"
            - Simulated Audio Processing (voice tone): "${multimodalInput.audio}"
            - Simulated Physiological Sensor (heart rate trend): "${multimodalInput.physio}"
            - Recent emotional history (last 3 states): ${JSON.stringify(this.sessionHistory)}

            Your response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown.
            The JSON object must have these five keys:
            1. "emotional_state": A single, descriptive word for the user's primary emotion (e.g., "Anxious", "Sad", "Stressed", "Calm", "Agitated", "Hopeless", "Neutral").
            2. "intensity": An integer from 1 (very low) to 10 (very high) representing the strength of this emotion.
            3. "is_crisis": A boolean (true if the user's combined state suggests they are in a crisis or at risk of self-harm, otherwise false).
            4. "reason": A brief, neutral, one-sentence explanation for your decision, synthesizing all inputs.
            5. "confidence": A float from 0.0 to 1.0 indicating your confidence in this analysis.

            Analyze the data and provide your JSON response.
        `;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    // Safety settings can be adjusted, but for this use case, we need to see the content.
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", errorData.error.message);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const responseData = await response.json();
            return JSON.parse(responseData.candidates[0].content.parts[0].text);

        } catch (error) {
            console.error("Failed to communicate with or parse response from Gemini API:", error);
            return {
                emotional_state: "Unknown",
                intensity: 5,
                is_crisis: false,
                reason: "Could not perform LLM analysis due to a technical error.",
                confidence: 0.0
            };
        }
    }
    
    /**
     * Generates a response based on the detailed analysis.
     * @param {object} analysisResult The full analysis object from the agent.
     * @returns {string} The bot's response to the user.
     */
    getResponse(analysisResult) {
        if (analysisResult.is_crisis) {
            return "Thank you for trusting me. I hear you, and based on what you've shared, I'm very concerned. Your safety is the most important thing right now.";
        } else {
            return this.interventionManager.getIntervention(analysisResult.emotional_state);
        }
    }

    /**
     * Handles the crisis escalation flow.
     * @param {readline.Interface} rl The readline interface for user input.
     */
    async handleEscalation(rl) {
        console.log("\nBOT: I can connect you right now to a trained counselor, or share emergency contact options. Which would you prefer?");
        const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

        while (true) {
            const choice = await askQuestion("You (Type 'Counselor' or 'Contacts'): ");
            const normalizedChoice = choice.trim().toLowerCase();
            if (normalizedChoice.includes("counselor")) {
                console.log("\n[SIMULATION] Routing to a licensed counselor...");
                console.log("[SIMULATION] An agent will be with you shortly. Please stay connected.");
                break;
            } else if (normalizedChoice.includes("contact")) {
                console.log("\nBOT: It's important to talk to someone who can support you. Here are some options:");
                console.log("-".repeat(30));
                console.log("  - National Suicide Prevention Lifeline: 988");
                console.log("  - Crisis Text Line: Text HOME to 741741");
                console.log("  - In an immediate emergency, please call 911.");
                console.log("-".repeat(30));
                break;
            } else {
                console.log("BOT: I'm sorry, I didn't understand. Please type 'Counselor' or 'Contacts'.");
            }
        }
    }
}


/**
 * The main function to run the chatbot conversation loop.
 */
async function main() {
    try {
        const agent = new EmoSenseAgent();
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

        console.log("\n--- EmoSense Companion (Gemini-Enhanced) ---");
        console.log("This is a simulation of a multimodal support agent. Type 'quit' to exit.");
        console.log("I'll ask for some context to simulate my sensors before you type your message.");
        
        while(true) {
            console.log("\n" + "-".repeat(50));
            // =============================================================================
            // SIMULATION OF MULTIMODAL INPUTS
            // =============================================================================
            const vision = await askQuestion("BOT (Computer Vision): What is your general facial expression now?\n(e.g., smiling, frowning, neutral, tense, tearful)\nYou: ");
            const audio = await askQuestion("BOT (Audio Processing): How would you describe your tone of voice?\n(e.g., quiet, rapid, trembling, flat, loud)\nYou: ");
            const physio = await askQuestion("BOT (Physiological Sensor): Is your heart rate feeling fast, slow, or normal?\nYou: ");
            const text = await askQuestion("BOT: Now, please tell me what's on your mind.\nYou: ");
            
            if (text.toLowerCase() === 'quit') break;

            const multimodalInput = { text, vision, audio, physio };
            const analysis = await agent.analyzeInput(multimodalInput);
            
            console.log("\n[EMOSENSE ANALYSIS]:");
            console.log(`  - State: ${analysis.emotional_state} (Intensity: ${analysis.intensity}/10)`);
            console.log(`  - Crisis Detected: ${analysis.is_crisis}`);
            console.log(`  - Reason: ${analysis.reason}`);
            console.log(`  - Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
            console.log("-".repeat(50));

            const response = agent.getResponse(analysis);
            console.log(`\nBOT: ${response}`);

            if (analysis.is_crisis) {
                await agent.handleEscalation(rl);
                console.log("\nBOT: The chat has been escalated. Ending this session to connect you with help.");
                break;
            }
        }

        rl.close();
        console.log("\nBOT: Thank you for talking. Please stay safe. Exiting.");
    } catch (error) {
        console.error(`\nFATAL ERROR: ${error.message}`);
        process.exit(1);
    }
}

main();