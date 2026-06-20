import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

// Helpers de dominio (en español):
// valueName(1) -> 'As'; 2..9 -> 'Dos'...'Nueve'; 10 -> 'Sota'; 11 -> 'Caballo'; 12 -> 'Rey'

const valueName = (value: number) => {
  switch (value) {
    case 1:
      return 'As';
    case 2:
      return 'Dos';
    case 3:
      return 'Tres';
    case 4:
      return 'Cuatro';
    case 5:
      return 'Cinco';
    case 6:
      return 'Seis';
    case 7:
      return 'Siete';
    case 8:
      return 'Ocho';
    case 9:
      return 'Nueve';
    case 10:
      return 'Sota';
    case 11:
      return 'Caballo';
    case 12:
      return 'Rey';
    default:
      throw new Error('Valor de carta no válido');
  }
};
// suitName('OROS') -> 'oros', etc.
const suitName = (suit: string) => suit.toLowerCase();

async function main() {
  const suits = ['OROS', 'COPAS', 'ESPADAS', 'BASTOS'] as const;
  const cards: Prisma.CardCreateManyInput[] = [];

  for (const suit of suits) {
    for (let value = 1; value <= 12; value++) {
      cards.push({
        value,
        suit,
        name: `${valueName(value)} de ${suitName(suit)}`,
      });
    }
  }
  // Los 2 comodines (sin palo ni valor)
  cards.push({ isJoker: true, name: 'Comodín' });
  cards.push({ isJoker: true, name: 'Comodín' });

  await prisma.card.deleteMany();
  await prisma.card.createMany({ data: cards });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
