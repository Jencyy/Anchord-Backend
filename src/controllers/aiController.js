/**
 * AI Controller
 * Handles interactions with the Google Gemini API for parsing natural language schedules.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini SDK with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @desc    Parse natural language text into structured schedule blocks
 * @route   POST /api/ai/parse-schedule
 * @access  Private
 */
exports.parseSchedule = async (req, res) => {
  const { text, lifeStage } = req.body;

  if (!text) {
    return res.status(400).json({ msg: 'Please provide text to parse.' });
  }

  try {
    // Determine the model to use. 'gemini-flash-latest' works within the free tier quota limits
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
      You are an assistant that extracts schedule blocks from a user's natural language description of their day.
      The user's life stage is: ${lifeStage || 'Unknown'}.
      
      User's input (Warning: May contain typos, bad grammar, and be very messy):
      "${text}"

      Extract all the distinct activities they mention with their estimated start and end times.
      If a time is missing, make a reasonable guess based on the activity and the user's life stage.
      Times MUST be in 24-hour format "HH:MM".
      Labels should be concise and capitalized like a title (e.g. "Morning Routine", "Deep Work").
      
      CRITICAL INSTRUCTION FOR DAY TYPE:
      The user may describe a regular day, or they may describe both a weekday AND a weekend/day off.
      For each block, determine if it belongs to their "weekday" routine or their "day_off" routine. 
      If they don't specify, assume "weekday".
      
      You must return ONLY a JSON array of objects. Do not include markdown formatting like \`\`\`json.
      
      Example output format:
      [
        { "label": "Morning Routine", "time_start": "07:00", "time_end": "08:00", "day_type": "weekday" },
        { "label": "Weekend Sleep In", "time_start": "09:00", "time_end": "10:30", "day_type": "day_off" }
      ]
      
      Output ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up potential markdown formatting that Gemini sometimes adds despite instructions
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    // Parse the JSON string into an array
    const parsedBlocks = JSON.parse(responseText);

    res.json(parsedBlocks);
  } catch (err) {
    console.error('AI Parsing error:', err.message);
    
    // Return the actual error so the user knows their API key has issues (e.g. quota limit 0)
    res.status(500).json({ 
      msg: 'Google AI Error: ' + (err.message.includes('429') ? 'API Quota Exceeded (Check Google AI Studio billing/limits)' : err.message) 
    });
  }
};

/**
 * @desc    Suggest anchors to stack a new habit onto, based on schedule gaps
 * @route   POST /api/ai/suggest-anchors
 * @access  Private
 */
exports.suggestAnchors = async (req, res) => {
  const { habit, anchors, lifeStage } = req.body;

  if (!habit || !anchors || anchors.length === 0) {
    return res.status(400).json({ msg: 'Please provide habit details and existing anchors.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
      You are an expert habit-building coach utilizing the principles of "Atomic Habits". 
      The user wants to work on this habit: "${habit.name}".
      The user's life stage is: ${lifeStage || 'Unknown'}.

      Here is their current schedule of anchors:
      ${JSON.stringify(anchors.map(a => ({ id: a._id, label: a.label, start: a.time_start, end: a.time_end, day: a.day_type })))}

      Your job is to do THREE things:
      1. Define a "normal day" version of this habit (e.g. "Read 10 pages", or "Zero social media").
      2. Define a "lazy day minimum version" for this habit. This should be the absolute smallest version they can do on their worst days (e.g. "Read 1 page" or "5 mins on social media"). Estimate how many minutes this minimum version takes.
      3. Define a short, practical "Strategy" using Atomic Habits principles. If it's a good habit (e.g. Reading, Walking), make it attractive and obvious (e.g. "Leave the book on your pillow"). If it's breaking a bad habit (e.g. Less phone, Quitting smoking), make it invisible and difficult (e.g. "Set a pattern password", "Put phone in B&W mode", "Delete the app").
      4. Find the best 3 anchors to "stack" this habit onto. Look for logical gaps that can fit the minimum version time cost. Consider logical pairings (e.g. exercise after waking up).

      Return ONLY a JSON object. Do not include markdown formatting like \`\`\`json.
      
      Output format:
      {
        "normal_version": "<the normal target version>",
        "min_version_name": "<the lazy day version, e.g., 'Read 1 page'>",
        "min_version_time": <number of minutes>,
        "strategy": "<1-2 sentences of Atomic Habits strategy>",
        "suggestions": [
          {
            "anchorId": "<the id of the recommended anchor>",
            "reason": "Stack this right after '<anchor label>' because..."
          }
        ]
      }
      
      Output ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const parsedSuggestions = JSON.parse(responseText);

    res.json(parsedSuggestions);
  } catch (err) {
    console.error('AI Suggestion error:', err.message);
    res.status(500).json({ 
      msg: 'Google AI Error: ' + (err.message.includes('429') ? 'API Quota Exceeded' : err.message) 
    });
  }
};
