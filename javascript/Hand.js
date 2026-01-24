'use strict';

import { calculateSums } from './helpers.js';

export class Hand {
  #isDealerHand;

  constructor(isDealerHand = false) {
    this.cards = [];
    this.#isDealerHand = isDealerHand;
  }

  // Overriding so Hand objects can be compared directly
  valueOf() {
    if (this.winsByFiveCardCharlieRule) return 23;
    if (this.hasBlackjack) return 22;
    if (this.isBust) return -1;

    return this.bestValue;
  }

  add(card) {
    this.cards.push(card);
  }

  get bestValue() {
    return Math.max(...this.values);
  }

  get isBust() {
    return this.bestValue > 21;
  }

  get hasBlackjack() {
    return this.bestValue === 21 && this.cards.length === 2;
  }

  get hasHardSeventeen() {
    return Math.min(...this.values) >= 17 && !this.isBust;
  }

  get winsByFiveCardCharlieRule() {
    return this.cards.length === 5 && !this.isBust && !this.#isDealerHand; // 5 Card Charlie rule only applies to the player
  }

  get values() {
    if (this._values && this._prevCardsCount === this.cards.length) return this._values;

    this._prevCardsCount = this.cards.length;

    return this._values = this.#calculatedValues;
  }

  #valuesOfCard(card) {
    switch(card.rank) {
      case 'A':
        return [1, 11];
      case 'J': case 'Q': case 'K':
        return [10];
      default:
        return [Number(card.rank)];
    }
  }

  get #calculatedValues() {
    if (this.cards.length === 1) return this.#valuesOfCard(this.cards[0]);

    const handValues = calculateSums(this.cards.map(card => this.#valuesOfCard(card)));

    if (handValues.includes(21)) return [21];
    if (handValues[0] > 21) return [handValues[0]];

    return [...new Set(handValues.filter(v => v < 21))]; // return values below 21, without duplicates
  }
}
