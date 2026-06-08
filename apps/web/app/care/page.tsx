'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, HelpCircle, MessageCircle, Phone, Send } from 'lucide-react'
import { useState } from 'react'

export default function CarePage() {
  const [priority, setPriority] = useState('normal')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const faqs = [
    {
      q: 'How do I add funds to my wallet?',
      a: 'You can add funds via credit card, bank transfer, or crypto deposit. Go to ORŸA Link to get started.',
    },
    {
      q: 'What chains does ORŸA support?',
      a: 'ORŸA supports 150+ chains including Ethereum, Solana, SUI, Polygon, and many more. View all chains in the Chains page.',
    },
    {
      q: 'How do I upgrade my membership?',
      a: 'Visit ORŸA Circle to view tier requirements and upgrade options. Your tier is based on trading volume.',
    },
    {
      q: 'What are the trading fees?',
      a: 'Fees vary by membership tier: Silver 0.25%, Gold 0.1%, Platinum 0%. Check ORŸA Circle for details.',
    },
  ]

  const supportHistory = [
    { id: '#12345', subject: 'Transaction inquiry', status: 'Resolved', date: 'Oct 28' },
    { id: '#12344', subject: 'KYC verification', status: 'In Progress', date: 'Oct 25' },
    { id: '#12343', subject: 'Withdrawal question', status: 'Resolved', date: 'Oct 20' },
  ]

  return (
    <div className="min-h-screen bg-bone-white dark:bg-dark-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            ORŸA Care
          </h1>
          <p className="text-gray-600 dark:text-gray-400">We're here to help, always</p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center hover:shadow-lg transition-shadow">
            <MessageCircle className="w-10 h-10 text-pale-gold dark:text-neon-gold mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-deep-charcoal dark:text-bone-white mb-1">
              Live Chat
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Instant response</p>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center hover:shadow-lg transition-shadow">
            <Phone className="w-10 h-10 text-pale-gold dark:text-neon-gold mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-deep-charcoal dark:text-bone-white mb-1">
              Call Us
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">24/7 available</p>
          </div>
        </div>

        {/* Submit Ticket */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Submit a Ticket
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                Priority
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                      priority === p.value
                        ? 'bg-pale-gold dark:bg-neon-gold border-pale-gold dark:border-neon-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Subject
              </label>
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Message
              </label>
              <Textarea
                placeholder="How can we help you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>

            <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Support History */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Support History
          </h2>
          <div className="space-y-3">
            {supportHistory.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-deep-charcoal dark:text-bone-white">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {ticket.id} • {ticket.date}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'Resolved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-pale-gold/20 dark:bg-neon-gold/20 text-pale-gold dark:text-neon-gold'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-12">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                Security Alerts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stay informed about your account</p>
            </div>
          </div>

          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="font-semibold text-sm text-deep-charcoal dark:text-bone-white">
              New device login detected
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              iPhone 15 Pro • New York, US • 2 hours ago
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Common Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-left hover:border-pale-gold dark:hover:border-neon-gold transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <HelpCircle className="w-5 h-5 text-pale-gold dark:text-neon-gold flex-shrink-0" />
                    <span className="font-medium text-deep-charcoal dark:text-bone-white text-sm">
                      {faq.q}
                    </span>
                  </div>
                  <span
                    className={`transform transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </div>

                {expandedFaq === index && (
                  <div className="mt-3 ml-8 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}