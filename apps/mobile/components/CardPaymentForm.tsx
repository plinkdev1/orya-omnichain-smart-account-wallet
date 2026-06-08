import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useMutation } from '@apollo/client';

interface CardPaymentFormProps {
  userId: string;
  onPaymentSuccess?: (paymentIntentId: string, clientSecret: string) => void;
  onPaymentError?: (error: string) => void;
  apiGatewayUrl: string;
}

interface PaymentIntentInitiationResponse {
  payment_intent_id: string;
  client_secret: string | null;
  status: string;
  amount: number;
  currency: string;
  requires_action: boolean;
  next_action: {
    type: string;
    use_stripe_sdk?: boolean;
    redirect_url?: string;
  } | null;
}

interface TokenizationResponse {
  payment_method_id: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  saved: boolean;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  userId,
  onPaymentSuccess,
  onPaymentError,
  apiGatewayUrl,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExpiryChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    setExpiry(cleaned);
  };

  const parseExpiry = (expiryStr: string): { month: string; year: string } | null => {
    const parts = expiryStr.split('/');
    if (parts.length === 2) {
      const month = parts[0];
      const year = `20${parts[1]}`;
      return { month, year };
    }
    return null;
  };

  const handleTokenizeAndPayment = async () => {
    if (!cardNumber || !expiry || !cvc || !amount) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    const expiryParts = parseExpiry(expiry);
    if (!expiryParts) {
      Alert.alert('Error', 'Invalid expiry date format');
      return;
    }

    setLoading(true);

    try {
      setLoading(true);
      const amountInCents = Math.round(parseFloat(amount) * 100);

      const tokenizeResponse = await fetch(
        `${apiGatewayUrl}/payment/method/tokenize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            card_number: cardNumber.replace(/\s/g, ''),
            exp_month: expiryParts.month,
            exp_year: expiryParts.year,
            cvc,
            save_for_future: saveCard,
          }),
        }
      );

      if (!tokenizeResponse.ok) {
        throw new Error('Card tokenization failed');
      }

      const tokenized: TokenizationResponse = await tokenizeResponse.json();
      console.log('Card tokenized:', tokenized);

      const paymentIntentResponse = await fetch(
        `${apiGatewayUrl}/payment/intent/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            amount_cents: amountInCents,
            currency,
            description: `Card payment - ${tokenized.card_brand} ending in ${tokenized.card_last4}`,
            payment_method_id: tokenized.payment_method_id,
            metadata: {
              card_brand: tokenized.card_brand,
              card_last4: tokenized.card_last4,
              mobile: 'true',
            },
          }),
        }
      );

      if (!paymentIntentResponse.ok) {
        throw new Error('Payment intent creation failed');
      }

      const paymentIntent: PaymentIntentInitiationResponse =
        await paymentIntentResponse.json();

      if (paymentIntent.requires_action) {
        if (
          paymentIntent.next_action?.type === 'redirect_to_url' &&
          paymentIntent.next_action?.redirect_url
        ) {
          Alert.alert(
            '3D Secure Required',
            'Your card requires additional verification. Please complete the 3D Secure authentication.',
            [
              {
                text: 'Open Authentication',
                onPress: async () => {
                  const confirmResponse = await fetch(
                    `${apiGatewayUrl}/payment/intent/confirm`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        payment_intent_id: paymentIntent.payment_intent_id,
                        payment_method_id: tokenized.payment_method_id,
                      }),
                    }
                  );

                  if (confirmResponse.ok) {
                    onPaymentSuccess?.(
                      paymentIntent.payment_intent_id,
                      paymentIntent.client_secret || ''
                    );
                  }
                },
              },
            ]
          );
        }
      } else if (paymentIntent.status === 'succeeded') {
        Alert.alert('Success', 'Payment completed successfully');
        onPaymentSuccess?.(
          paymentIntent.payment_intent_id,
          paymentIntent.client_secret || ''
        );
      } else {
        Alert.alert('Payment Processing', 'Your payment is being processed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      Alert.alert('Error', errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="4111 1111 1111 1111"
          placeholderTextColor="#999"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          maxLength={19}
          editable={!loading}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Expiry (MM/YY)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor="#999"
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="numeric"
              maxLength={5}
              editable={!loading}
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>CVC</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor="#999"
              value={cvc}
              onChangeText={setCvc}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <View style={styles.currencySelector}>
            <TextInput
              style={styles.currencyInput}
              value={currency}
              onChangeText={setCurrency}
              maxLength={3}
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setSaveCard(!saveCard)}
          disabled={loading}
        >
          <View style={[styles.checkbox, saveCard && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>Save this card for future payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleTokenizeAndPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay {currency} {amount}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formSection: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  amountInput: {
    flex: 1,
  },
  currencySelector: {
    width: 70,
  },
  currencyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});
