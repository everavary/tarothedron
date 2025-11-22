
export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 340; // Tarot ratio approx 1.7
export const CARD_BORDER_RADIUS = 12;

// How much the cards are offset from the center in the "loose" state
export const MAX_OFFSET = 160;
export const MIN_OFFSET = 40;

export const TAROT_BACK_URL = "https://upload.wikimedia.org/wikipedia/commons/f/fc/Waite%E2%80%93Smith_Tarot_Roses_and_Lilies_cropped.jpg";

export enum Suit {
  CUPS = 'cups',
  PENTACLES = 'pentacles',
  SWORDS = 'swords',
  WANDS = 'wands',
  MAJOR = 'major'
}

export enum CardPosition {
  WEST = 'west',
  NORTH = 'north',
  EAST = 'east',
  SOUTH = 'south',
}

// Helper to create stable Wikimedia Commons URLs
const getWikiUrl = (filename: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;

const TAROT_URLS: Record<string, string> = {
    // MAJOR ARCANA - Using canonical RWS filenames
    'major_0': getWikiUrl('RWS_Tarot_00_Fool.jpg'),
    'major_1': getWikiUrl('RWS_Tarot_01_Magician.jpg'),
    'major_2': getWikiUrl('RWS_Tarot_02_High_Priestess.jpg'),
    'major_3': getWikiUrl('RWS_Tarot_03_Empress.jpg'),
    'major_4': getWikiUrl('RWS_Tarot_04_Emperor.jpg'),
    'major_5': getWikiUrl('RWS_Tarot_05_Hierophant.jpg'),
    'major_6': getWikiUrl('RWS_Tarot_06_Lovers.jpg'), // CORRECTED LINK
    'major_7': getWikiUrl('RWS_Tarot_07_Chariot.jpg'),
    'major_8': getWikiUrl('RWS_Tarot_08_Strength.jpg'),
    'major_9': getWikiUrl('RWS_Tarot_09_Hermit.jpg'),
    'major_10': getWikiUrl('RWS_Tarot_10_Wheel_of_Fortune.jpg'),
    'major_11': getWikiUrl('RWS_Tarot_11_Justice.jpg'),
    'major_12': getWikiUrl('RWS_Tarot_12_Hanged_Man.jpg'),
    'major_13': getWikiUrl('RWS_Tarot_13_Death.jpg'),
    'major_14': getWikiUrl('RWS_Tarot_14_Temperance.jpg'),
    'major_15': getWikiUrl('RWS_Tarot_15_Devil.jpg'),
    'major_16': getWikiUrl('RWS_Tarot_16_Tower.jpg'),
    'major_17': getWikiUrl('RWS_Tarot_17_Star.jpg'),
    'major_18': getWikiUrl('RWS_Tarot_18_Moon.jpg'),
    'major_19': getWikiUrl('RWS_Tarot_19_Sun.jpg'),
    'major_20': getWikiUrl('RWS_Tarot_20_Judgement.jpg'),
    'major_21': getWikiUrl('RWS_Tarot_21_World.jpg'),

    // CUPS (Standard filenames: Cups01.jpg ... Cups14.jpg)
    'cups_ace': getWikiUrl('Cups01.jpg'),
    'cups_2': getWikiUrl('Cups02.jpg'),
    'cups_3': getWikiUrl('Cups03.jpg'),
    'cups_4': getWikiUrl('Cups04.jpg'),
    'cups_5': getWikiUrl('Cups05.jpg'),
    'cups_6': getWikiUrl('Cups06.jpg'),
    'cups_7': getWikiUrl('Cups07.jpg'),
    'cups_8': getWikiUrl('Cups08.jpg'),
    'cups_9': getWikiUrl('Cups09.jpg'),
    'cups_10': getWikiUrl('Cups10.jpg'),
    'cups_page': getWikiUrl('Cups11.jpg'),
    'cups_knight': getWikiUrl('Cups12.jpg'),
    'cups_queen': getWikiUrl('Cups13.jpg'),
    'cups_king': getWikiUrl('Cups14.jpg'),

    // PENTACLES (Standard filenames: Pents01.jpg ... Pents14.jpg)
    'pentacles_ace': getWikiUrl('Pents01.jpg'),
    'pentacles_2': getWikiUrl('Pents02.jpg'),
    'pentacles_3': getWikiUrl('Pents03.jpg'),
    'pentacles_4': getWikiUrl('Pents04.jpg'),
    'pentacles_5': getWikiUrl('Pents05.jpg'),
    'pentacles_6': getWikiUrl('Pents06.jpg'),
    'pentacles_7': getWikiUrl('Pents07.jpg'),
    'pentacles_8': getWikiUrl('Pents08.jpg'),
    'pentacles_9': getWikiUrl('Pents09.jpg'),
    'pentacles_10': getWikiUrl('Pents10.jpg'),
    'pentacles_page': getWikiUrl('Pents11.jpg'),
    'pentacles_knight': getWikiUrl('Pents12.jpg'),
    'pentacles_queen': getWikiUrl('Pents13.jpg'),
    'pentacles_king': getWikiUrl('Pents14.jpg'),

    // SWORDS (Standard filenames: Swords01.jpg ... Swords14.jpg)
    'swords_ace': getWikiUrl('Swords01.jpg'),
    'swords_2': getWikiUrl('Swords02.jpg'),
    'swords_3': getWikiUrl('Swords03.jpg'),
    'swords_4': getWikiUrl('Swords04.jpg'),
    'swords_5': getWikiUrl('Swords05.jpg'),
    'swords_6': getWikiUrl('Swords06.jpg'),
    'swords_7': getWikiUrl('Swords07.jpg'),
    'swords_8': getWikiUrl('Swords08.jpg'),
    'swords_9': getWikiUrl('Swords09.jpg'),
    'swords_10': getWikiUrl('Swords10.jpg'),
    'swords_page': getWikiUrl('Swords11.jpg'),
    'swords_knight': getWikiUrl('Swords12.jpg'),
    'swords_queen': getWikiUrl('Swords13.jpg'),
    'swords_king': getWikiUrl('Swords14.jpg'),

    // WANDS (Standard filenames: Wands01.jpg ... Wands14.jpg)
    'wands_ace': getWikiUrl('Wands01.jpg'),
    'wands_2': getWikiUrl('Wands02.jpg'),
    'wands_3': getWikiUrl('Wands03.jpg'),
    'wands_4': getWikiUrl('Wands04.jpg'),
    'wands_5': getWikiUrl('Wands05.jpg'),
    'wands_6': getWikiUrl('Wands06.jpg'),
    'wands_7': getWikiUrl('Wands07.jpg'),
    'wands_8': getWikiUrl('Wands08.jpg'),
    'wands_9': getWikiUrl('Tarot_Nine_of_Wands.jpg'), // CORRECTED: Special filename case
    'wands_10': getWikiUrl('Wands10.jpg'),
    'wands_page': getWikiUrl('Wands11.jpg'),
    'wands_knight': getWikiUrl('Wands12.jpg'),
    'wands_queen': getWikiUrl('Wands13.jpg'),
    'wands_king': getWikiUrl('Wands14.jpg')
};

export const getTarotDeck = () => {
    const deck = [];

    // Major Arcana
    const majors = [
        "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
        "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
        "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
        "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
        "Judgement", "The World"
    ];

    for (let i = 0; i < majors.length; i++) {
        deck.push({
            suit: Suit.MAJOR,
            rank: i.toString(),
            label: majors[i],
            imageUrl: TAROT_URLS[`major_${i}`]
        });
    }

    // Minor Arcana
    const suits = [Suit.CUPS, Suit.PENTACLES, Suit.SWORDS, Suit.WANDS];
    const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king'];
    
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                suit,
                rank,
                label: `${rank} of ${suit}`,
                imageUrl: TAROT_URLS[`${suit}_${rank}`]
            });
        }
    }

    return deck;
};
