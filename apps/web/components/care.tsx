"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Phone, HelpCircle, Send, AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export function Care() {
  const [priority, setPriority] = useState("normal")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen px-6 pt-8 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <HamburgerMenu />
          <h1 className="text-2xl font-bold">ORŸA</h1>
        </div>
        <ThemeToggle />
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ORŸA Care</h1>
        <p className="text-muted-foreground font-serif">We're here to help, always</p>
      </header>

      {/* Contact Methods */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <MessageCircle className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Live Chat</h4>
          <p className="text-xs text-muted-foreground">Instant response</p>
        </Card>
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <Phone className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Call Us</h4>
          <p className="text-xs text-muted-foreground">24/7 available</p>
        </Card>
      </div>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <h3 className="text-lg font-semibold mb-4">Submit a Ticket</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "Low", color: "border-border" },
                { value: "normal", label: "Normal", color: "border-primary" },
                { value: "high", label: "High", color: "border-destructive" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`h-10 rounded-xl border-2 transition-all duration-300 ${
                    priority === p.value ? `${p.color} bg-primary/10 font-semibold` : "border-border hover:bg-secondary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Subject" className="h-12" />
          <textarea
            placeholder="How can we help you today?"
            className="w-full min-h-[120px] p-3 rounded-2xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth"
          />
          <Button className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 glow-gold">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </Card>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Support History</h3>
        <div className="space-y-3">
          {[
            { id: "#12345", subject: "Transaction inquiry", status: "Resolved", date: "Oct 28" },
            { id: "#12344", subject: "KYC verification", status: "In Progress", date: "Oct 25" },
            { id: "#12343", subject: "Withdrawal question", status: "Resolved", date: "Oct 20" },
          ].map((ticket) => (
            <Card key={ticket.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-smooth">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.id} • {ticket.date}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    ticket.status === "Resolved" ? "bg-chart-1/20 text-chart-1" : "bg-primary/20 text-primary"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-chart-1/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-chart-1" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Security Alerts</h3>
            <p className="text-xs text-muted-foreground">Stay informed about your account</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-white border border-border/50">
            <p className="text-sm font-medium mb-1">New device login detected</p>
            <p className="text-xs text-muted-foreground">iPhone 15 Pro • New York, US • 2 hours ago</p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Common Questions</h3>
        <div className="space-y-2">
          {[
            {
              q: "How do I add funds to my wallet?",
              a: "You can add funds via credit card, bank transfer, or crypto deposit. Go to ORŸA Link to get started.",
            },
            {
              q: "What chains does ORŸA support?",
              a: "ORŸA supports 150+ chains including Ethereum, Solana, SUI, Polygon, and many more. View all chains in the Chains page.",
            },
            {
              q: "How do I upgrade my membership?",
              a: "Visit ORŸA Circle to view tier requirements and upgrade options. Your tier is based on trading volume.",
            },
            {
              q: "What are the trading fees?",
              a: "Fees vary by membership tier: Silver 0.25%, Gold 0.1%, Platinum 0%. Check ORŸA Circle for details.",
            },
          ].map((faq, index) => (
            <Card
              key={index}
              className="border-0 shadow-sm hover:shadow-md transition-smooth cursor-pointer overflow-hidden"
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
              {expandedFaq === index && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-muted-foreground font-serif pl-8">{faq.a}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


