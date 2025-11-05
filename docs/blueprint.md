# **App Name**: Prompt Jeopardy

## Core Features:

- Admin Dashboard: Allow an admin user to create a new game, manage game settings, and control the game flow.
- Unique Game URL: Generate a unique URL for each new game instance that contestants can use to join.
- Contestant Login: Allow contestants to log in with their Google credentials and use their avatar and name during the game.
- Question Input: Allow contestants to ask the LLM questions by typing or speaking into a microphone.
- LLM Response: Present a relatively short answer to a contestant’s question incorporating the selected persona and action, portraying characteristics from multiple personas or actions from the relevant pools. Play audio as words appear on the screen.
- Answer Period: Provide a timed answer period where contestants can select the correct persona and action. Track and display the contestants submissions
- Scoring and Leaderboard: Implement a scoring system with varying point consequences, updating the scoreboard in real-time and award confetti if you guess the persona and action correctly. After a correct response by someone, let the admin advance the game. Save games into Firestore.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey a sense of intellect and challenge, subtly hinting at the strategic aspect of the game.
- Background color: Very light gray (#F0F0F0) for a clean and distraction-free interface that ensures readability.
- Accent color: Warm orange (#FF9800) to draw attention to important actions and choices, symbolizing creativity and inspiration.
- Headline font: 'Space Grotesk' sans-serif for a computerized and techy feel that is appropriate for a game centered on LLMs.
- Body font: 'Inter' sans-serif for a clean, neutral look that complements the technical style.
- Use clean, minimalist icons to represent game elements and actions.
- Divide the screen into clear sections for questions, responses, contestant cards, and the timer. Ensure the layout is responsive and adapts to different screen sizes.
- Use subtle animations to highlight changes, updates, and results. Show animated confetti around a user’s card when they guess a round correctly.