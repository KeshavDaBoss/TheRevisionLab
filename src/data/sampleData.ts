import { Chapter } from "../types";

export const SAMPLE_CHAPTERS: Chapter[] = [
  {
    id: "chapter-light",
    name: "Light - Reflection & Refraction",
    topics: [
      {
        id: "spherical-mirrors",
        name: "Spherical Mirrors & Reflection",
        quiz: {
          questions: [
            {
              id: "q1",
              text: "What type of image is formed by a concave mirror when the object is placed between the Pole (P) and Focus (F)?",
              subtext: "Note: Think about ray diagrams for makeup or shaving mirrors.",
              options: [
                "Real and Inverted",
                "Virtual and Erect",
                "Real and Erect",
                "Virtual and Inverted",
                "No image is formed"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "q2",
              text: "The focal length of a spherical mirror is defined as:",
              subtext: "The relationship between Radius of Curvature (R) and Focal Length (f) is R = 2f.",
              options: [
                "Half of its radius of curvature",
                "Double of its radius of curvature",
                "Equal to its radius of curvature",
                "Triple of its radius of curvature"
              ],
              correctAnswerIndex: 0
            },
            {
              id: "q3",
              text: "Which mirror is widely used as a rear-view mirror in vehicles?",
              subtext: "Consider which mirror gives a wider field of view and forms an erect image.",
              options: [
                "Concave mirror",
                "Convex mirror",
                "Plane mirror",
                "Plano-concave mirror"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fc1",
            front: "What is the relation between focal length (f) and radius of curvature (R) of a spherical mirror?",
            back: "R = 2f or f = R/2.\nThe focal length is exactly half of the radius of curvature."
          },
          {
            id: "fc2",
            front: "Why are convex mirrors preferred as rear-view mirrors in vehicles?",
            back: "Because they always give an erect (upright) though diminished image, and offer a wider field of view as they curve outwards."
          },
          {
            id: "fc3",
            front: "What sign convention is used for the focal length of a concave mirror?",
            back: "According to the Cartesian sign convention, the focal length of a concave mirror is always negative (-f)."
          },
          {
            id: "fc4",
            front: "What is the Mirror Formula?",
            back: "1/f = 1/v + 1/u\nWhere f is focal length, v is image distance, and u is object distance."
          }
        ]
      },
      {
        id: "refraction-lens",
        name: "Refraction of Light & Lenses",
        quiz: {
          questions: [
            {
              id: "ql1",
              text: "What is the SI unit of power of a lens?",
              subtext: "Represented by the symbol D.",
              options: [
                "Meter",
                "Dioptre",
                "Watt",
                "Newton",
                "Joule"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "ql2",
              text: "When a ray of light passes from an optically rarer medium to a denser medium, it:",
              subtext: "Think about light entering water or glass from air.",
              options: [
                "Bends towards the normal",
                "Bends away from the normal",
                "Goes straight without bending",
                "Reflects completely back"
              ],
              correctAnswerIndex: 0
            }
          ]
        },
        flashcards: [
          {
            id: "fcl1",
            front: "What is Snell's Law of refraction?",
            back: "The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant for a given pair of media.\nsin(i) / sin(r) = constant (refractive index)."
          },
          {
            id: "fcl2",
            front: "What is the formula for Power of a Lens?",
            back: "P = 1 / f (where f is focal length in meters).\nPower is measured in Dioptres (D)."
          }
        ]
      }
    ]
  },
  {
    id: "chapter-chemical-reactions",
    name: "Chemical Reactions & Equations",
    topics: [
      {
        id: "types-reactions",
        name: "Types of Chemical Reactions",
        quiz: {
          questions: [
            {
              id: "qc1",
              text: "Which type of reaction occurs when two or more substances combine to form a single product?",
              subtext: "Example: CaO + H2O → Ca(OH)2 + Heat",
              options: [
                "Decomposition Reaction",
                "Combination Reaction",
                "Displacement Reaction",
                "Double Displacement Reaction"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "qc2",
              text: "Respiration is considered an:",
              subtext: "Energy is released during digestion and glucose breakdown.",
              options: [
                "Endothermic reaction",
                "Exothermic reaction",
                "Neutralization reaction",
                "Precipitation reaction"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fcc1",
            front: "Define an Exothermic Reaction.",
            back: "A reaction in which heat is released along with the formation of products."
          },
          {
            id: "fcc2",
            front: "What is a Double Displacement Reaction?",
            back: "A chemical reaction in which there is an exchange of ions between the reactants to form new compounds."
          }
        ]
      },
      {
        id: "redox-corrosion",
        name: "Oxidation, Reduction & Corrosion",
        quiz: {
          questions: [
            {
              id: "qc3",
              text: "What is oxidation in terms of oxygen transfer?",
              subtext: "Think about gain or loss.",
              options: [
                "Loss of oxygen",
                "Gain of oxygen",
                "No change in oxygen",
                "Gain of hydrogen"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fcc3",
            front: "Define a Redox Reaction.",
            back: "A chemical reaction in which one reactant undergoes oxidation (loses electrons/gains oxygen) while another undergoes reduction (gains electrons/loses oxygen) simultaneously."
          },
          {
            id: "fcc4",
            front: "What is Rancidity and how can it be prevented?",
            back: "Rancidity is the oxidation of fats and oils in food causing foul smell and taste.\nPrevention: Adding antioxidants, flushing bags with Nitrogen gas, or airtight storage."
          }
        ]
      }
    ]
  },
  {
    id: "chapter-genetics",
    name: "Principles of Inheritance & Genetics",
    topics: [
      {
        id: "mendelian-genetics",
        name: "Mendelian Inheritance",
        quiz: {
          questions: [
            {
              id: "qb1",
              text: "What is the phenotypic ratio of a Mendelian monohybrid cross in the F2 generation?",
              subtext: "Consider Mendel's experiments on tall and dwarf pea plants.",
              options: [
                "1:2:1",
                "3:1",
                "9:3:3:1",
                "1:1"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fcb1",
            front: "What are the three laws of inheritance proposed by Gregor Mendel?",
            back: "1. Law of Dominance\n2. Law of Segregation\n3. Law of Independent Assortment"
          },
          {
            id: "fcb2",
            front: "What is a Test Cross?",
            back: "A cross between an organism displaying a dominant phenotype (unknown genotype) and a homozygous recessive organism to determine its genotype."
          }
        ]
      }
    ]
  }
];
