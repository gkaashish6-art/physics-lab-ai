// ============================================================
// PhysicsVerse AI Integration Module
// Claude API + Web Speech API + Comprehensive Fallbacks
// ============================================================

// --------------- API Configuration ---------------
let CLAUDE_API_KEY = 'YOUR_KEY_HERE';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

// --------------- Fallback Explanations ---------------
const fallbackExplanations = {
    'Mercury': `Mercury is the smallest planet in our solar system and the closest to the Sun, orbiting at an average distance of just 58 million kilometers. Despite being so close to our star, Mercury is not the hottest planet — that title goes to Venus. Mercury's lack of a substantial atmosphere means it cannot trap heat, so temperatures swing wildly from about 430°C during the day to -180°C at night.

One of Mercury's most fascinating features is its enormous iron core, which makes up about 75% of the planet's radius. This gives Mercury the highest density of any planet after Earth. Scientists believe a massive ancient collision may have stripped away much of Mercury's outer layers, leaving behind this oversized metallic heart.

Mercury's surface is heavily cratered, resembling our Moon, and is marked by towering cliffs called "lobate scarps" that stretch for hundreds of kilometers. These cliffs formed as Mercury's interior cooled and the entire planet shrank — imagine a grape shriveling into a raisin! The MESSENGER spacecraft, which orbited Mercury from 2011 to 2015, revealed surprising discoveries including water ice hiding in permanently shadowed craters near the poles.

A day on Mercury (one full rotation) takes about 59 Earth days, while a year (one orbit around the Sun) takes only 88 Earth days. This means Mercury experiences just three days for every two of its years — one of the quirkiest orbital relationships in our solar system.`,

    'Venus': `Venus is often called Earth's sister planet because of their similar size, mass, and composition — but that's where the family resemblance ends. Venus is the hottest planet in our solar system, with surface temperatures averaging a scorching 465°C, hot enough to melt lead. This extreme heat is caused by a runaway greenhouse effect: Venus's thick atmosphere of carbon dioxide traps solar energy so efficiently that the planet became an oven.

The atmosphere of Venus is incredibly dense — about 90 times the pressure of Earth's atmosphere at sea level. That's equivalent to being nearly a kilometer deep in Earth's oceans! The clouds on Venus aren't made of water vapor like on Earth; instead, they're composed of sulfuric acid droplets that create a permanent, hazy shroud hiding the surface from view.

Venus rotates backward compared to most planets (retrograde rotation), and it does so extremely slowly. A single Venusian day lasts about 243 Earth days — longer than its year of 225 Earth days. This means the Sun rises in the west and sets in the east, and a "day" on Venus is actually longer than a "year."

Despite its hellish conditions, Venus has been a prime target for space exploration. The Soviet Venera missions in the 1970s and 1980s successfully landed on the surface and sent back the first photographs of another planet's terrain, revealing a rocky, barren landscape bathed in an eerie orange glow. Future missions like NASA's VERITAS and DAVINCI aim to uncover whether Venus once had oceans and a more Earth-like climate.`,

    'Earth': `Earth is the third planet from the Sun and the only known planet to harbor life. Orbiting at an average distance of about 150 million kilometers — a distance so fundamental it's called one Astronomical Unit (AU) — Earth sits in the "Goldilocks zone" where conditions are just right for liquid water to exist on the surface. This liquid water, covering about 71% of our planet, is the key ingredient that makes Earth's biosphere possible.

Our planet has a layered internal structure: a thin rocky crust, a thick silicate mantle, and a dense iron-nickel core. The outer core is liquid and generates Earth's magnetic field through a process called the geodynamo. This magnetic field is crucial — it creates the magnetosphere, which shields us from harmful solar wind and cosmic radiation, essentially acting as an invisible force field protecting all life on Earth.

Earth's atmosphere is composed primarily of nitrogen (78%) and oxygen (21%), with trace amounts of argon, carbon dioxide, and water vapor. This atmosphere not only provides the air we breathe but also regulates temperature through a natural greenhouse effect, keeping the average global temperature at a comfortable 15°C. The ozone layer in the upper atmosphere filters out most of the Sun's damaging ultraviolet radiation.

One of Earth's most remarkable features is plate tectonics — the movement of enormous crustal plates that reshape continents, create mountains, trigger earthquakes, and drive volcanic activity. This geological engine recycles carbon and other elements, helping regulate Earth's climate over millions of years. Combined with the stabilizing influence of our relatively large Moon (which moderates axial tilt), plate tectonics helps maintain the long-term conditions necessary for complex life.`,

    'Mars': `Mars, the Red Planet, has fascinated humans for centuries with its distinctive rusty color, visible even to the naked eye. That reddish hue comes from iron oxide (rust) in the Martian soil and dust. Mars is about half the diameter of Earth and has only about one-tenth of Earth's mass, making it a much smaller and less massive world — but it's packed with incredible geological features.

Mars is home to the largest volcano and the deepest canyon in the entire solar system. Olympus Mons rises about 22 kilometers above the surrounding plains — nearly three times the height of Mount Everest — and its base is so wide it would cover most of France. Valles Marineris, the great Martian canyon system, stretches over 4,000 kilometers long, up to 200 kilometers wide, and 7 kilometers deep — making the Grand Canyon look like a scratch in comparison.

Strong evidence suggests that Mars once had liquid water flowing on its surface. Orbital images reveal ancient river channels, lake beds, and mineral deposits that only form in the presence of water. Today, water exists on Mars primarily as ice — in the polar ice caps and as subsurface deposits. The thin Martian atmosphere (about 1% of Earth's pressure) and cold temperatures (averaging about -60°C) prevent liquid water from being stable on the surface today.

Mars has two tiny, irregularly shaped moons named Phobos and Deimos, likely captured asteroids. Multiple rovers — including Curiosity and Perseverance — are currently exploring the Martian surface, analyzing rocks, searching for signs of ancient microbial life, and even producing oxygen from the carbon dioxide atmosphere. Mars remains the top candidate for future human exploration, and space agencies worldwide are working toward sending astronauts to the Red Planet in the coming decades.`,

    'Jupiter': `Jupiter is the king of planets — the largest in our solar system by a tremendous margin. With a diameter of about 143,000 kilometers, Jupiter is so massive that over 1,300 Earths could fit inside it. In fact, Jupiter contains more than twice the mass of all other planets combined! Despite its enormous size, Jupiter is a gas giant with no solid surface — it's composed primarily of hydrogen and helium, similar in composition to the Sun itself.

The most iconic feature of Jupiter is the Great Red Spot, a colossal anticyclonic storm that has been raging for at least 350 years. This storm is so large that Earth could fit inside it, and wind speeds at its edges exceed 400 kilometers per hour. Jupiter's atmosphere is a dynamic, colorful canvas of swirling cloud bands, jet streams, and lightning storms that dwarf anything on Earth — some Jovian lightning bolts are thousands of times more powerful than terrestrial ones.

Jupiter has an extraordinary magnetic field, about 20,000 times stronger than Earth's. This creates a vast magnetosphere that extends millions of kilometers into space, trapping charged particles and generating intense radiation belts. Jupiter's rapid rotation — a full day lasts only about 10 hours despite its immense size — contributes to this powerful magnetic dynamo and causes the planet to visibly bulge at its equator.

Jupiter has at least 95 known moons, forming a miniature solar system of its own. The four largest — Io, Europa, Ganymede, and Callisto — were discovered by Galileo in 1610 and were among the first objects found to orbit another planet. Europa is one of the most exciting places in the solar system for astrobiologists: beneath its icy crust lies a global ocean of liquid water that may contain more water than all of Earth's oceans combined, making it a prime candidate in the search for extraterrestrial life.`,

    'Saturn': `Saturn is famous for its stunning ring system, the most extensive and visible of any planet. These rings are made up of billions of particles of ice and rock, ranging in size from tiny grains to chunks as large as houses. Despite spanning up to 282,000 kilometers in diameter, the rings are incredibly thin — typically only about 10 meters thick. They are believed to be relatively young in astronomical terms, perhaps only 100 million years old, possibly formed from a destroyed moon or captured comet.

As the second-largest planet in our solar system, Saturn has a diameter of about 120,500 kilometers and could hold over 760 Earths inside it. Like Jupiter, Saturn is a gas giant composed mostly of hydrogen and helium, but it has an extraordinary characteristic: Saturn's average density is only about 0.687 grams per cubic centimeter — less than water. If you could find a bathtub big enough, Saturn would float!

Saturn's atmosphere features powerful jet streams, with wind speeds near the equator reaching up to 1,800 kilometers per hour — among the fastest in the solar system. A peculiar hexagonal cloud pattern sits at Saturn's north pole, a persistent jet stream structure spanning about 30,000 kilometers across. This hexagonal storm, with each side longer than Earth's diameter, is one of the most geometrically perfect natural phenomena ever observed in space.

Saturn has over 140 known moons, the most of any planet. Titan, its largest moon, is bigger than the planet Mercury and is the only moon in the solar system with a dense atmosphere. Titan has lakes and seas of liquid methane and ethane on its surface, making it the only other body in the solar system besides Earth with stable surface liquids. Another moon, Enceladus, shoots geysers of water ice from its south pole, hinting at a subsurface ocean that could potentially support microbial life.`,

    'Uranus': `Uranus is one of the ice giants of our solar system, distinctly different from the gas giants Jupiter and Saturn. While hydrogen and helium dominate its atmosphere, Uranus contains significantly more "ices" — water, methane, and ammonia — in its interior. The methane in its upper atmosphere absorbs red light and reflects blue-green wavelengths, giving Uranus its characteristic pale cyan color that makes it one of the most visually unique planets.

Perhaps the most bizarre feature of Uranus is its extreme axial tilt of about 98 degrees — the planet essentially rolls around the Sun on its side. Scientists believe a massive collision with an Earth-sized object early in the solar system's history knocked Uranus onto its side. This extreme tilt creates the most unusual seasons of any planet: each pole gets about 42 years of continuous sunlight followed by 42 years of darkness during the planet's 84-Earth-year orbit.

Uranus has 13 known rings, discovered in 1977 — they are dark, narrow, and composed primarily of small, dark particles. The planet also has 27 known moons, all named after characters from the works of William Shakespeare and Alexander Pope. Miranda, one of the most geologically interesting moons, has a patchwork surface with enormous canyons up to 12 times deeper than the Grand Canyon, suggesting a violent geological history.

Despite being the third-largest planet by diameter (about 51,000 kilometers), Uranus is surprisingly cold — the coldest planetary atmosphere in the solar system, with temperatures dropping to about -224°C. Unlike other giant planets, Uranus radiates very little internal heat, which remains one of the great mysteries of planetary science. Voyager 2 remains the only spacecraft to have visited Uranus, flying past in 1986 and revealing a world far more complex and interesting than anyone had imagined.`,

    'Neptune': `Neptune is the most distant planet in our solar system, orbiting at an average distance of about 4.5 billion kilometers from the Sun — so far away that sunlight takes over four hours to reach it. Discovered in 1846 through mathematical predictions rather than direct observation, Neptune was the first planet found through the power of physics and mathematics. Astronomers noticed that Uranus's orbit didn't match predictions, and calculated that another massive planet must be pulling on it gravitationally.

Neptune is an ice giant similar to Uranus but with a strikingly vivid deep blue color, caused by methane in its atmosphere absorbing red light. What makes Neptune truly remarkable is its incredibly dynamic weather despite receiving so little solar energy. Neptune has the fastest winds in the solar system, with speeds reaching up to 2,100 kilometers per hour — faster than the speed of sound on Earth! When Voyager 2 flew past in 1989, it photographed the Great Dark Spot, an Earth-sized storm similar to Jupiter's Great Red Spot.

A year on Neptune lasts about 165 Earth years, meaning it has completed only one full orbit since its discovery in 1846 — it finished that first observed orbit in 2011. Despite its great distance, Neptune has a surprisingly active internal heat source, radiating about 2.6 times more energy than it receives from the Sun. This internal energy drives its violent weather systems and helps explain how such a distant, cold world can have such dynamic atmospheric activity.

Neptune has 16 known moons, the largest being Triton — one of the most intriguing objects in the solar system. Triton orbits Neptune in the opposite direction (retrograde) of the planet's rotation, strongly suggesting it was captured from the Kuiper Belt. Triton has active geysers that shoot nitrogen gas and dark dust particles up to 8 kilometers into its thin atmosphere, making it one of the few geologically active moons. Neptune also has a faint ring system composed of dust particles and ice.`,

    'electromagnetism': `Electromagnetism is one of the four fundamental forces of nature, and it governs nearly everything you experience in daily life — from the light you see to the phone in your hand. At its core, electromagnetism describes the relationship between electric charges and magnetic fields. Moving electric charges create magnetic fields, and changing magnetic fields create electric forces. This beautiful dance between electricity and magnetism was unified by James Clerk Maxwell in the 1860s through his famous four equations, which are considered one of the greatest achievements in physics.

Electric fields are created by stationary charges and exert forces on other charges. If you've ever rubbed a balloon on your hair and watched it stick to a wall, you've seen electric forces in action. Magnetic fields, on the other hand, are created by moving charges (electric currents) and affect other moving charges. This is the principle behind every electric motor and generator on Earth — moving charges in a wire create magnetic fields, and moving magnets near wires create electric currents.

One of Maxwell's most profound discoveries was that light itself is an electromagnetic wave — oscillating electric and magnetic fields propagating through space at about 300,000 kilometers per second. This means visible light, radio waves, microwaves, X-rays, and gamma rays are all forms of electromagnetic radiation, differing only in wavelength and frequency. The entire electromagnetic spectrum, from the radio waves carrying your Wi-Fi signal to the gamma rays from distant supernovae, is governed by the same fundamental physics.

Electromagnetic forces are responsible for holding atoms together, enabling chemical reactions, transmitting nerve signals in your body, and powering virtually all modern technology. Every time you flip a light switch, use a computer, or listen to music, you're harnessing electromagnetism. The electromagnetic force is about 10^36 times stronger than gravity, which is why a tiny refrigerator magnet can hold up a paperclip against the gravitational pull of the entire Earth.`,

    'newton': `Sir Isaac Newton's three laws of motion form the foundation of classical mechanics and describe how objects move (or don't move) in response to forces. Published in 1687 in his groundbreaking work "Principia Mathematica," these laws revolutionized our understanding of the physical world and remained unchallenged for over two centuries until Einstein's theory of relativity. Even today, Newton's laws are accurate enough to guide spacecraft across the solar system and engineer everything from bridges to roller coasters.

Newton's First Law, the Law of Inertia, states that an object at rest stays at rest, and an object in motion stays in motion at a constant velocity, unless acted upon by an external force. This means a hockey puck sliding on frictionless ice would glide forever in a straight line. The tendency of objects to resist changes in their motion is called inertia, and it's directly related to mass — the more massive an object, the harder it is to change its motion. This is why you lurch forward when a car suddenly stops — your body wants to keep moving at the car's original speed.

Newton's Second Law is the famous F = ma (force equals mass times acceleration). This law quantifies exactly how forces change an object's motion: the acceleration of an object is directly proportional to the net force applied and inversely proportional to its mass. Push a shopping cart with a certain force, and it accelerates. Load it with groceries (more mass), and the same push produces less acceleration. This elegant equation is arguably the most important equation in classical physics, used in everything from calculating rocket trajectories to designing car safety systems.

Newton's Third Law states that for every action, there is an equal and opposite reaction. When you push against a wall, the wall pushes back on you with exactly the same force. When a rocket expels hot gas downward, the gas pushes the rocket upward. When you walk, your foot pushes the ground backward, and the ground pushes you forward. These action-reaction force pairs always act on different objects and are always equal in magnitude but opposite in direction. This law is what makes rockets work in the vacuum of space — they don't need air to push against, they just need to expel mass in one direction to accelerate in the other.`
};

// --------------- Fallback Quizzes ---------------
const fallbackQuizzes = {
    'solar': [
        {
            question: 'Which planet in our solar system has the strongest gravitational pull?',
            options: [
                'A) Saturn',
                'B) Jupiter',
                'C) Neptune',
                'D) Uranus'
            ],
            answer: 'B'
        },
        {
            question: 'What causes Mars to appear red when viewed from Earth?',
            options: [
                'A) Its thick atmosphere scatters red light',
                'B) Iron oxide (rust) in its soil and dust',
                'C) Volcanic lava covering the surface',
                'D) Reflection of light from its moons'
            ],
            answer: 'B'
        },
        {
            question: 'Which planet has the fastest wind speeds in the solar system, reaching up to 2,100 km/h?',
            options: [
                'A) Jupiter',
                'B) Saturn',
                'C) Neptune',
                'D) Uranus'
            ],
            answer: 'C'
        },
        {
            question: 'What is the primary reason Venus is hotter than Mercury despite being farther from the Sun?',
            options: [
                'A) Venus has active volcanoes producing heat',
                'B) Venus rotates more slowly, absorbing more heat',
                'C) Venus has a thick atmosphere causing a runaway greenhouse effect',
                'D) Venus has a larger iron core generating internal heat'
            ],
            answer: 'C'
        },
        {
            question: 'Saturn\'s rings are primarily composed of which material?',
            options: [
                'A) Volcanic rock and metals',
                'B) Gas and dust clouds',
                'C) Ice particles and rocky debris',
                'D) Liquid methane droplets'
            ],
            answer: 'C'
        }
    ],

    'electromagnetism': [
        {
            question: 'What fundamental discovery did James Clerk Maxwell make about light?',
            options: [
                'A) Light is made of particles called photons',
                'B) Light is an electromagnetic wave',
                'C) Light travels at different speeds in a vacuum',
                'D) Light can only travel through a medium'
            ],
            answer: 'B'
        },
        {
            question: 'What happens when a magnetic field changes near a conducting wire?',
            options: [
                'A) The wire becomes permanently magnetized',
                'B) The wire heats up due to friction',
                'C) An electric current is induced in the wire',
                'D) The wire repels all nearby charges'
            ],
            answer: 'C'
        },
        {
            question: 'Which of the following is NOT a form of electromagnetic radiation?',
            options: [
                'A) X-rays',
                'B) Sound waves',
                'C) Microwaves',
                'D) Gamma rays'
            ],
            answer: 'B'
        },
        {
            question: 'How much stronger is the electromagnetic force compared to gravity?',
            options: [
                'A) About 100 times stronger',
                'B) About 10,000 times stronger',
                'C) About 10^36 times stronger',
                'D) They are approximately equal in strength'
            ],
            answer: 'C'
        },
        {
            question: 'A moving electric charge creates which of the following?',
            options: [
                'A) Only an electric field',
                'B) Only a magnetic field',
                'C) Both an electric field and a magnetic field',
                'D) Neither an electric nor a magnetic field'
            ],
            answer: 'C'
        }
    ],

    'newton': [
        {
            question: 'According to Newton\'s First Law, what will an object in motion do if no external force acts on it?',
            options: [
                'A) Gradually slow down and stop',
                'B) Continue moving at constant velocity in a straight line',
                'C) Accelerate indefinitely',
                'D) Move in a circular path'
            ],
            answer: 'B'
        },
        {
            question: 'If you double the net force on an object while keeping its mass constant, what happens to its acceleration according to F = ma?',
            options: [
                'A) Acceleration is halved',
                'B) Acceleration stays the same',
                'C) Acceleration is doubled',
                'D) Acceleration is quadrupled'
            ],
            answer: 'C'
        },
        {
            question: 'A rocket in space propels itself forward by expelling gas backward. Which of Newton\'s Laws best explains this?',
            options: [
                'A) First Law (Law of Inertia)',
                'B) Second Law (F = ma)',
                'C) Third Law (Action-Reaction)',
                'D) Law of Universal Gravitation'
            ],
            answer: 'C'
        },
        {
            question: 'An object has a mass of 5 kg and experiences a net force of 20 N. What is its acceleration?',
            options: [
                'A) 100 m/s²',
                'B) 4 m/s²',
                'C) 25 m/s²',
                'D) 0.25 m/s²'
            ],
            answer: 'B'
        },
        {
            question: 'Why do passengers lurch forward when a bus suddenly brakes?',
            options: [
                'A) The braking force pushes them forward',
                'B) Gravity pulls them toward the front of the bus',
                'C) Their bodies tend to maintain their original state of motion (inertia)',
                'D) Air resistance inside the bus pushes them forward'
            ],
            answer: 'C'
        }
    ]
};

// --------------- API Functions ---------------

/**
 * Get an AI-generated explanation for a physics topic.
 * Falls back to pre-written explanations if the API call fails or no API key is set.
 */
async function getExplanation(topic, context) {
    // If no valid API key, use fallback immediately
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'YOUR_KEY_HERE') {
        return getFallbackExplanation(topic);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 1000,
                system: 'You are a friendly, enthusiastic physics teacher explaining concepts to high school students. Use simple language, real-world analogies, and make it exciting. Keep explanations to 3-4 short paragraphs.',
                messages: [
                    {
                        role: 'user',
                        content: `Explain ${topic}. Context: ${context}`
                    }
                ]
            })
        });

        if (!response.ok) {
            console.warn(`Claude API returned status ${response.status}. Using fallback.`);
            return getFallbackExplanation(topic);
        }

        const data = await response.json();

        if (data.content && data.content.length > 0 && data.content[0].text) {
            return data.content[0].text;
        }

        return getFallbackExplanation(topic);
    } catch (error) {
        console.error('Error calling Claude API for explanation:', error);
        return getFallbackExplanation(topic);
    }
}

/**
 * Retrieve a fallback explanation by matching the topic against known keys.
 */
function getFallbackExplanation(topic) {
    const topicLower = topic.toLowerCase();

    // Try exact match first
    for (const key of Object.keys(fallbackExplanations)) {
        if (key.toLowerCase() === topicLower) {
            return fallbackExplanations[key];
        }
    }

    // Try partial match
    for (const key of Object.keys(fallbackExplanations)) {
        if (topicLower.includes(key.toLowerCase()) || key.toLowerCase().includes(topicLower)) {
            return fallbackExplanations[key];
        }
    }

    // Generic fallback
    return `${topic} is a fascinating topic in physics! While our AI assistant is currently unavailable, here's what you should know: physics helps us understand the fundamental rules that govern the universe, from the tiniest subatomic particles to the largest galaxies. Every topic in physics connects to real-world phenomena you can observe around you every day.\n\nTo learn more about ${topic}, try exploring your textbook, watching educational videos, or conducting simple experiments at home. Physics is best learned through curiosity and hands-on exploration. Keep asking questions — that's what great scientists do!`;
}

/**
 * Generate a quiz on a physics topic using the Claude API.
 * Falls back to pre-written quizzes if the API call fails or no API key is set.
 */
async function generateQuiz(topic) {
    // If no valid API key, use fallback immediately
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'YOUR_KEY_HERE') {
        return getFallbackQuiz(topic);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 1500,
                system: 'You are a physics quiz generator. Generate exactly 5 multiple choice questions. Return ONLY valid JSON array with no other text. Each item has: question (string), options (array of 4 strings labeled A-D), answer (string, the correct option letter A/B/C/D).',
                messages: [
                    {
                        role: 'user',
                        content: `Generate 5 multiple choice quiz questions about ${topic} suitable for high school students.`
                    }
                ]
            })
        });

        if (!response.ok) {
            console.warn(`Claude API returned status ${response.status}. Using fallback quiz.`);
            return getFallbackQuiz(topic);
        }

        const data = await response.json();

        if (data.content && data.content.length > 0 && data.content[0].text) {
            const text = data.content[0].text.trim();

            // Try to extract JSON from the response (handle possible markdown code fences)
            let jsonString = text;
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }

            const quiz = JSON.parse(jsonString);

            if (Array.isArray(quiz) && quiz.length > 0) {
                return quiz;
            }
        }

        return getFallbackQuiz(topic);
    } catch (error) {
        console.error('Error calling Claude API for quiz:', error);
        return getFallbackQuiz(topic);
    }
}

/**
 * Retrieve a fallback quiz by matching the topic against known keys.
 */
function getFallbackQuiz(topic) {
    const topicLower = topic.toLowerCase();

    // Try exact match first
    for (const key of Object.keys(fallbackQuizzes)) {
        if (key.toLowerCase() === topicLower) {
            return fallbackQuizzes[key];
        }
    }

    // Try partial match
    for (const key of Object.keys(fallbackQuizzes)) {
        if (topicLower.includes(key.toLowerCase()) || key.toLowerCase().includes(topicLower)) {
            return fallbackQuizzes[key];
        }
    }

    // Default to solar system quiz if no match found
    return fallbackQuizzes['solar'];
}

// --------------- Speech Functions ---------------

/**
 * Speak the given text aloud using the Web Speech API.
 * Returns a cancel function that can be called to stop speaking.
 */
function speakText(text) {
    // Cancel any ongoing speech first
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);

    // Return a function that can be called to cancel speaking
    return function cancel() {
        window.speechSynthesis.cancel();
    };
}

/**
 * Stop any currently playing speech synthesis.
 */
function stopSpeaking() {
    speechSynthesis.cancel();
}

// --------------- Set API Key ---------------

/**
 * Update the Claude API key at runtime.
 */
function setApiKey(key) {
    CLAUDE_API_KEY = key;
    console.log('PhysicsAI: API key has been updated.');
}

// --------------- Public API (window export) ---------------

window.PhysicsAI = {
    getExplanation,
    generateQuiz,
    speakText,
    stopSpeaking,
    setApiKey
};
