'use strict';

import { Hand } from './javascript/Hand.js';
import { withTimeout, shuffledArray } from './javascript/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  const SUITS = Object.freeze(['diamonds', 'hearts', 'spades', 'clubs']);
  const RANKS = Object.freeze(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);
  const FULL_DECK_OF_CARDS = Object.freeze(generatedDeckOfCards());
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
    playerHand = new Hand();
    dealerHand = new Hand(true);
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
      hand.add(card);
    }, withDelay ? DRAW_DELAY_IN_MS : 0);
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
    if (playerHand.cards.length === MAX_CARDS_IN_DECK || playerHand.bestValue === 21 || playerHand.isBust) {
      stand();
    }
  }

  async function drawFinalDealerCards() {
    while (dealerShouldDrawCards()) {
      await drawDealerCard().then(updateDisplayedDealerHandValue);
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
    handValueEl.value = onlyBest ? hand.bestValue : hand.values.join(' or ');
  }

  function handleGameOutcome() {
    if (playerHand > dealerHand) {
      showEndDialog('Win');
    } else if (playerHand < dealerHand) {
      showEndDialog('Loss');
    } else {
      showEndDialog('Push');
    }
  }

  function dealerShouldDrawCards() {
    return !dealerHand.isBust && dealerHand < playerHand && dealerHand.cards.length < MAX_CARDS_IN_DECK
             && !dealerHand.hasHardSeventeen && !playerHand.winsByFiveCardCharlieRule && !playerHand.hasBlackjack;
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
