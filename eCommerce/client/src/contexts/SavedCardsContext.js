import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';
import { useEffect } from 'react';

/**
 * SavedCardsContext
 *
 * Manages the full lifecycle of a customer's saved payment cards on the
 * client side. Cards are identified by the internal `id` (UUID) assigned
 * by the server; the processor-vault reference (`processorCardId`) is
 * stored server-side only and never surfaced to the UI.
 *
 * Card shape exposed to consumers:
 *   { id, brand, last4, expMonth, expYear, isDefault }
 */

const SavedCardsContext = createContext(null);

export const SavedCardsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);


  //─── UseEffect ─────────────────────────────────────────────────────────────

  useEffect(() => {
  if (isAuthenticated) {
    fetchSavedCards();
  } else {
    clearSavedCards();
  }
  }, [isAuthenticated]);


  // ─── Fetch ────────────────────────────────────────────────────────────────

  /**
   * Loads saved cards from the server. Safe to call on mount or after
   * authentication. No-ops silently when the user is not authenticated.
   */
  const fetchSavedCards = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/user/saved-cards');
      setSavedCards(response.data.cards || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load saved cards';
      console.error('Error fetching saved cards:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ─── Add ──────────────────────────────────────────────────────────────────

  /**
   * Saves a new card after the payment processor has vaulted it.
   *
   * @param {object} cardData
   *   { processorCardId, brand, last4, expMonth, expYear, setAsDefault? }
   *   processorCardId — vault token from the payment processor SDK (never raw PAN)
   * @returns {object|null} The newly created card, or null on failure.
   */
  const addSavedCard = useCallback(async (cardData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/user/saved-cards', cardData);
      const newCard = response.data.card;

      setSavedCards((prev) => {
        // If new card is default, demote existing defaults in local state too
        const updated = cardData.setAsDefault
          ? prev.map((c) => ({ ...c, isDefault: false }))
          : [...prev];
        return [...updated, newCard];
      });

      return newCard;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save card';
      console.error('Error saving card:', err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Remove ───────────────────────────────────────────────────────────────

  /**
   * Deletes a saved card by its internal ID.
   * If the deleted card was the default, the server promotes the first
   * remaining card; this function reflects that in local state.
   *
   * @param {string} cardId — internal UUID of the card to remove
   * @returns {boolean} true on success
   */
  const removeSavedCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.delete(`/api/user/saved-cards/${cardId}`);
      // Server returns the authoritative updated list after promotion logic
      setSavedCards(response.data.cards || []);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove card';
      console.error('Error removing card:', err);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Set Default ──────────────────────────────────────────────────────────

  /**
   * Marks a card as the default payment method.
   *
   * @param {string} cardId — internal UUID of the card to promote
   * @returns {boolean} true on success
   */
  const setDefaultCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.patch(`/api/user/saved-cards/${cardId}/default`);
      setSavedCards(response.data.cards || []);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update default card';
      console.error('Error setting default card:', err);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Returns the current default card, or undefined if none exist. */
  const defaultCard = savedCards.find((c) => c.isDefault);

  /** Clears local state — call on logout. */
  const clearSavedCards = useCallback(() => {
    setSavedCards([]);
    setError(null);
  }, []);

  // TODO: Fix the provider
  return (
    <SavedCardsContext.Provider
      value={{
        savedCards,
        defaultCard,
        loading,
        error,
        fetchSavedCards,
        addSavedCard,
        removeSavedCard,
        setDefaultCard,
        clearSavedCards,
      }}
    >
      {children}
    </SavedCardsContext.Provider>
  );
};

export const useSavedCards = () => {
  const context = useContext(SavedCardsContext);
  if (!context) throw new Error('useSavedCards must be used within a SavedCardsProvider');
  return context;
};

