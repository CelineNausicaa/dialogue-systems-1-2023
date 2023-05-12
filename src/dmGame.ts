import { MachineConfig, send, Action, assign } from "xstate"; 


function say(text: string): Action<SDSContext, SDSEvent> {
  return send((_context: SDSContext) => ({ type: "SPEAK", value: text }));
}

interface Grammar {
  [index: string]: {
    intent: string;
    entities: {
      [index: string]: string;
    };
  };
}

const grammar: Grammar = {
  "hjälp": {
    intent: "None",
    entities: { help: "help"},
  },
  "fuska": {
    intent: "None",
    entities: { cheat: "cheat"},
  },
  "skippa": {
    intent: "None",
    entities: { skip: "skip"},
  },
  "instrument": {
    intent: "None",
    entities: { instruments: "instruments"},
  },
  "djur": {
    intent: "None",
    entities: { animals: "animals"},
  },
  "resa": {
    intent: "None",
    entities: { travel: "travel"},
  },
  "nej": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nah": {
    intent: "None",
    entities: { denial: "no"},
  },
  "det tror jag inte": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nej nej": {
    intent: "None",
    entities: { denial: "no"},
  },
  "ja": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "jo": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "javisst": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "jaa": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "ja, tack": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
};

const getEntity = (context: SDSContext, entity: string) => {
  // lowercase the utterance and remove tailing "."
  let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  if (u in grammar) {
    if (entity in grammar[u].entities) {
      return grammar[u].entities[entity];
    }
  }
  return false;
};

function insertImage(langImage: any) {
  const img = document.getElementById("image");
  const myImage = img.innerHTML = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-image: url('/img/${langImage}.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center; width: 70%; height: 70%;">
    <img src="/img/${langImage}.jpg" style="opacity: 0;"/>
  </div>`;
    return myImage;
};


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = {
  initial: "idle",
  states: {
    idle: {
      on: {
        CLICK: "init",
      },
    },
    init: {
      on: {
        TTS_READY: "welcome",
        CLICK: "welcome",
      },
    },
    welcome: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: "startInstruments",
            cond: (context) => !!getEntity(context, "instrument"),
          },
          {
            target: "startAnimals",
            cond: (context) => !!getEntity(context, "animals"),
          },
          {
            target: "startTravel",
            cond: (context) => !!getEntity(context, "travel"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "startAnimals",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicAnimals" && context.recResult[0].confidence >= 0.6,

          },
          {
            target: "confirmStartAnimals",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicAnimals" && context.recResult[0].confidence < 0.6,

          },
          {
            target: "startInstruments",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicInstruments" && context.recResult[0].confidence >= 0.6,
          },
          {
            target: "confirmStartInstruments",
            // cond: (context)  ....&& 
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicInstruments" && context.recResult[0].confidence < 0.6,
          },
          {
            target: "startTravel",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicTravel" && context.recResult[0].confidence >= 0.6,
          },
          {
            target: "confirmStartTravel",
            // cond: (context)  ....&& 
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicTravel" && context.recResult[0].confidence < 0.6,
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], 
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Hej hej och välkomna till detta språkspel!` 
                    //Spelets mål är att lära dig nya svenska ord. Du måste bara berätta för mig vad du ser på bilderna. Men var försoktig: du har bara tre försök. Om du behöver lite hjälp, kan du bara säga hjälp. Du kan också skippa en bild om du säger skippa. Du kan också få en fusklapp, om du säger fuska. Är du redo? Först ska du välja ett ämne: djur, instrument, eller resa. 
                    //Hello there! Welcome to this language game. The goal is simple: tell me what you see on the images, for now just in English. You have three attempts to get it right. You can ask for help at any time by saying help, skip an image by saying skip, or have a look a a cheat sheet by saying cheat. Are you ready? First, let's pick a topic: animals, instruments, or travel. ${insertImage("welcome")},
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: Please pick a category: animals, instruments, or travel",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: Please pick a category: animals, instruments, or travel",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. I would like to know which category you want to learn about. It can be either animals, instruments or travel."
          ),
          on: { ENDSPEECH: "#root.dm.welcome" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmStartAnimals: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startAnimals",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "You chose the category animals, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: you chose the category animals, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: You chose the category animals, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. I would like you to confirm if you want to choose the category animals."
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartAnimals" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    startAnimals: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="giraff",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me the name of this animal. In English, this would be a giraffe ${insertImage("giraffe")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: Please tell me the name of this animal. In English, this would be a giraffe.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: Please tell me the name of this animal. In English, this would be a giraffe.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. This animal starts with the letter G."
          ),
          on: { ENDSPEECH: "#root.dm.startAnimals" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.animals1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it" + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition" },
    },

    delayTransition: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startAnimals'}
    },

    animals1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="björn",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me the name of this animal. In English, this would be a bear. ${insertImage("bear")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: Please tell me the name of this animal. In English, this would be a bear.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: Please tell me the name of this animal. In English, this would be a bear.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. This animal starts with the letter B."
          ),
          on: { ENDSPEECH: "#root.dm.animals1" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition1" },
    },

    delayTransition1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals1'}
    },

    

    startTravel: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="plan",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me what you see on the picture. In English, that would be a plane ${insertImage("plane")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Second prompt: Please tell me what you see on the picture. In English, that would be a plane ${insertImage("plane")}`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Third prompt: Please tell me what you see on the picture. In English, that would be a plane ${insertImage("plane")}`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. This mode of transport starts with the letter P."
          ),
          on: { ENDSPEECH: "#root.dm.startTravel" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.travel1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel" },
    },

    delayTransitionTravel: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startTravel'}
    },

    confirmStartTravel: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startTravel",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], //shouldnt assign any count there, otherwise it will go to prompt 2 ie. if the person asks for help eg.
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "You chose the category travel, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: you chose the category travel, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: You chose the category travel, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. I would like you to confirm if you want to choose the category travel."
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartAnimals" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    travel1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="resväska",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me the name of what you see on the picture. In English, this would be a suitcase. ${insertImage("luggage")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: Please tell me the name of what you see on the picture. In English, this would be a suitcase.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Please tell me the name of what you see on the picture. In English, this would be a suitcase.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. The object on the picture starts with the letter S."
          ),
          on: { ENDSPEECH: "#root.dm.travel1" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel1" },
    },

    delayTransitionTravel1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel1'}
    },

    startInstruments: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="fjol",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: "instruments1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="violin",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me the name of this instrument. In English, this would be a violin. ${insertImage("violin")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Second prompt: Please tell me the name of this instrument. In English, this would be a violin.`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Third prompt: Please tell me the name of this instrument. In English, this would be a violin.`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            `You just asked for help. This instrument starts with the letter V.`
          ),
          on: { ENDSPEECH: "#root.dm.startInstruments" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.instruments1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments" },
    },

    delayTransitionInstruments: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startInstruments'}
    },

    confirmStartInstruments: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startInstruments",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], //shouldnt assign any count there, otherwise it will go to prompt 2 ie. if the person asks for help eg.
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "You chose the category instruments, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Second prompt: you chose the category instruments, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Third prompt: You chose the category instruments, is that right?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. I would like you to confirm if you want to choose the category instruments."
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartInstruments" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    instruments1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="cello",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Please tell me the name of this instrument. In English, this would be a cello. ${insertImage("cello")}`,
                  })),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Please tell me the name of this instrument. In English, this would be a cello.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Please tell me the name of this instrument. In English, this would be a cello.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "You just asked for help. This instrument starts with the letter C."
          ),
          on: { ENDSPEECH: "#root.dm.instruments1" },
        },
        skip: {
          entry: say(
            "Skipping this image."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, That is not correct. Try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Alright, let me give you the cheat sheet. You will have ten seconds to look at it." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments1" },
    },

    delayTransitionInstruments1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments1'}
    },


    info: {
      entry: send((context) => ({
        type: "SPEAK",
        value: `Great, you finished the game with ${context.points} points!`,
      })),
      on: { ENDSPEECH: "init" },
    },
  },
};

const kbRequest = (text: string) =>
  fetch(
    new Request(
      `https://cors.eu.org/https://api.duckduckgo.com/?q=${text}&format=json&skip_disambig=1`
    )
  ).then((data) => data.json());