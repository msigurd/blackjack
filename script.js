'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const SUITS = Object.freeze(['diamonds', 'hearts', 'spades', 'clubs']);
  const RANKS = Object.freeze(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);
  const FULL_DECK_OF_CARDS = Object.freeze(generatedDeckOfCards());
  const FRESH_HAND = Object.freeze({ values: [], ranks: [] });
  const DRAW_DELAY_IN_MS = 500;
  const MAX_CARDS_IN_DECK = 5;
  const ACTIONS = document.getElementById('actions');
  const END_DIALOG = document.getElementById('end-dialog');
  const GAME_RESULT = document.getElementById('game-result');
  const DEALER_DECK = document.getElementById('dealer-deck');
  const PLAYER_DECK = document.getElementById('player-deck');
  const DEALER_HAND_VALUE = document.getElementById('dealer-hand-value');
  const PLAYER_HAND_VALUE = document.getElementById('player-hand-value');
  const PLAY_BTN = document.getElementById('play-btn');
  const PLAY_AGAIN_BTN = document.getElementById('play-again-btn');
  const HIT_BTN = document.getElementById('hit-btn');
  const STAND_BTN = document.getElementById('stand-btn');
  const CARD_TEMPLATE = document.getElementById('card-template');
  let deckOfCards, playerHand, dealerHand;

  toggleActionButtons(false);

  function start() {
    showActions();
    play();
  }

  function play() {
    reset();
    deal().then(() => {
      toggleActionButtons(true);
      standIfMaxOrBust();
    });
  }

  function reset() {
    deckOfCards = shuffledArray(FULL_DECK_OF_CARDS);
    playerHand = structuredClone(FRESH_HAND);
    dealerHand = structuredClone(FRESH_HAND);
    PLAYER_HAND_VALUE.value = '-';
    DEALER_HAND_VALUE.value = '???';
    DEALER_DECK.replaceChildren();
    PLAYER_DECK.replaceChildren();
    END_DIALOG.close();
  }

  function deal() {
    return drawPlayerCard()
             .then(() => drawDealerCard(true))
             .then(drawPlayerCard)
             .then(() => drawDealerCard());
  }

  function showActions() {
    PLAY_BTN.remove();
    ACTIONS.removeAttribute('hidden');
  }

  function showEndDialog(result) {
    GAME_RESULT.innerText = result;
    setTimeout(() => END_DIALOG.show(), DRAW_DELAY_IN_MS);
  }

  function toggleActionButtons(on) {
    toggleButton(HIT_BTN, on);
    toggleButton(STAND_BTN, on);
  }

  function toggleButton(buttonEl, on) {
    buttonEl.disabled = !on;
  }

  function drawPlayerCard(withDelay = true) {
    return drawCard(PLAYER_DECK, playerHand, false, withDelay).then(updateDisplayedPlayerHandValue);
  }

  function drawDealerCard(isFirst = false, withDelay = true) {
    return drawCard(DEALER_DECK, dealerHand, isFirst, withDelay);
  }

  function drawCard(deckEl, hand, isFirst = false, withDelay = true) {
    return withTimeout(() => {
      const card = deckOfCards.pop();
      deckEl.appendChild(generatedCardEl(card, isFirst));
      addCardToHand(hand, card);
    }, withDelay ? DRAW_DELAY_IN_MS : 0);
  }

  function addCardToHand(hand, card) {
    hand.ranks.push(card.rank);
    hand.values = calculatedHandValues(hand.ranks);
  }

  function calculatedHandValues(ranksInHand) {
    if (ranksInHand.length === 1) return valuesOfRank(ranksInHand[0]);

    const handValues = calculateSums(ranksInHand.map(rank => valuesOfRank(rank)));

    if (handValues.includes(21)) return [21];
    if (handValues[0] > 21) return [handValues[0]];

    return [...new Set(handValues.filter(v => v < 21))]; // return values below 21, without duplicates
  }

  function hit() {
    drawPlayerCard(false).then(standIfMaxOrBust);
  }

  function stand() {
    toggleActionButtons(false);
    updateDisplayedPlayerHandValue(true);
    revealDealerHand();
    drawFinalDealerCards().then(() => {
      updateDisplayedDealerHandValue(true);
      handleGameOutcome();
    });
  }

  function standIfMaxOrBust() {
    if (deckIsFull(PLAYER_DECK) || bestHandValue(playerHand) === 21 || handBusts(playerHand)) {
      stand();
    }
  }

  async function drawFinalDealerCards() {
    while (dealerShouldDrawCards()) {
      await drawDealerCard().then(updateDisplayedDealerHandValue);
    }
  }

  function valuesOfRank(rank) {
    switch(rank) {
      case 'A':
        return [1, 11];
      case 'J': case 'Q': case 'K':
        return [10];
      default:
        return [Number(rank)];
    }
  }

  function revealDealerHand() {
    revealDealerCard();
    updateDisplayedDealerHandValue();
  }

  function revealDealerCard() {
    DEALER_DECK.querySelector('.face-down').classList.remove('face-down');
  }

  function updateDisplayedPlayerHandValue(onlyBest = false) {
    updateDisplayedHandValue(PLAYER_HAND_VALUE, playerHand, onlyBest);
  }

  function updateDisplayedDealerHandValue(onlyBest = false) {
    updateDisplayedHandValue(DEALER_HAND_VALUE, dealerHand, onlyBest);
  }

  function updateDisplayedHandValue(handValueEl, hand, onlyBest = false) {
    handValueEl.value = onlyBest ? bestHandValue(hand) : hand.values.join(' or ');
  }

  function handleGameOutcome() {
    if (playerIsGuaranteedToWin() || playerHasHigherHand()) {
      showEndDialog('Win');
    } else if (playerIsGuaranteedToLose() || playerHasLowerHand()) {
      showEndDialog('Loss');
    } else {
      showEndDialog('Push');
    }
  }

  function bestHandValue(hand) {
    return Math.max(...hand.values);
  }

  function dealerHasHardSeventeen() {
    return bestHandValue(dealerHand) >= 17 && !dealerHand.values.includes('A') && !handBusts(dealerHand);
  }

  function handBusts(hand) {
    return bestHandValue(hand) > 21;
  }

  function handHasBlackjack(hand) {
    return bestHandValue(hand) === 21 && hand.ranks.length === 2;
  }

  function playerWinsByFiveCardCharlieRule() {
    return playerHand.ranks.length === 5 && !handBusts(playerHand);
  }

  function playerIsGuaranteedToWin() {
    return handBusts(dealerHand) || playerWinsByFiveCardCharlieRule() || handHasBlackjack(playerHand) && !handHasBlackjack(dealerHand);
  }

  function playerIsGuaranteedToLose() {
    return handBusts(playerHand) || !playerWinsByFiveCardCharlieRule() && !handHasBlackjack(playerHand) && handHasBlackjack(dealerHand);
  }

  function playerHasHigherHand() {
    return !handBusts(playerHand) && bestHandValue(playerHand) > bestHandValue(dealerHand);
  }

  function playerHasLowerHand() {
    return !handBusts(dealerHand) && bestHandValue(playerHand) < bestHandValue(dealerHand);
  }

  function dealerShouldDrawCards() {
    return !(playerIsGuaranteedToWin() || playerIsGuaranteedToLose() || playerHasLowerHand() ||
             deckIsFull(DEALER_DECK) || dealerHasHardSeventeen());
  }

  function deckIsFull(deckEl) {
    return deckEl.querySelectorAll('.card').length === MAX_CARDS_IN_DECK;
  }

  function generatedCardEl({ suit, rank }, isFaceDown = false) {
    const cardClone = CARD_TEMPLATE.content.cloneNode(true);
    cardClone.querySelector('.card').classList.add(suit);
    if (isFaceDown) cardClone.querySelector('.card').classList.add('face-down');
    cardClone.querySelector('.card-rank').innerText = rank;
    cardClone.querySelectorAll('img').forEach(img => img.setAttribute('src', `assets/suit-symbols/${suit}.svg`));

    return cardClone;
  }

  function generatedDeckOfCards() {
    const deckOfCards = [];

    SUITS.forEach(suit => {
      RANKS.forEach(rank => deckOfCards.push({ suit, rank }));
    });

    return deckOfCards;
  }

  PLAY_BTN.addEventListener('click', start);
  PLAY_AGAIN_BTN.addEventListener('click', play);
  HIT_BTN.addEventListener('click', hit);
  STAND_BTN.addEventListener('click', stand);
});

/* Helpers */

// Calculates all possible sums of an array of number arrays
// Example: calculateSums([[5], [1, 11]]) will return [6, 16]
function calculateSums(arrays) {
  return arrays.reduce((acc, curr) => {
    const sums = [];

    acc.forEach(sum => {
      curr.forEach(num => sums.push(sum + num));
    });

    return sums;
  }, [0]);
}

function withTimeout(callback, ms) {
  return new Promise(resolve => setTimeout(() => {
    callback();
    resolve();
  }, ms));
}

// Based on https://stackoverflow.com/a/12646864
function shuffledArray(array) {
  const shuffledArray = structuredClone(array);

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
}
