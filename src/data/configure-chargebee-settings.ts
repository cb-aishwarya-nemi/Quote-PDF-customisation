import type { LucideIcon } from "lucide-react"
import { ArrowLeftRight, Clock } from "lucide-react"

export type ConfigureSettingItem = {
  title: string
  description?: string
  meta?: string
  badge?: "NEW"
  href?: string
  icon?: LucideIcon
}

export type ConfigureSettingsSection = {
  title: string
  description: string
  items: ConfigureSettingItem[]
}

export const CONFIGURE_CHARGEBEE_SECTIONS: ConfigureSettingsSection[] = [
  {
    title: "Billing",
    description:
      "Set up your billing essentials. Manage billing rules, payment gateways, and more.",
    items: [
      {
        title: "Business profile",
        description: "Organization address and time zone.",
        meta: "Ashy-Socks-657",
      },
      {
        title: "Business entities",
        description:
          "Create and manage multiple business entities in one Chargebee site, each with its own settings, tax rules, currency, branding, etc.",
      },
      {
        title: "Product Catalog",
        description:
          "Set up the products that will be available for plans and addons in your product catalog.",
      },
      {
        title: "Entitlements",
        description:
          "Configure entitlement versions and customer-level entitlements.",
      },
      {
        title: "Billing LogIQ",
        description:
          "Set up how billing works with changes to subscriptions, pricing, invoicing, and more.",
      },
      {
        title: "Payment gateways",
        meta: "Configured: Test Gateway",
      },
      {
        title: "Currencies",
        meta: "INR, USD",
      },
      {
        title: "Taxes",
      },
    ],
  },
  {
    title: "Agentic AI",
    description:
      "Provide AI assistance to help only answer Chargebee data and workflows for your team and external users.",
    items: [
      {
        title: "Copilot",
        description:
          "AI assistant for your team. Each teammate gets a Copilot that answers questions, troubleshoots issues, and takes actions using the access their role already has.",
      },
      {
        title: "MCP Servers",
        description:
          "Connect Chargebee to external AI clients like Claude, ChatGPT, Cursor, or custom agents. These clients can securely access your data, workflows, and product knowledge.",
      },
    ],
  },
  {
    title: "CPQ",
    description:
      "Set up your Chargebee selling workflow with basic configurations, quote formats for your sales team, and approval rules.",
    items: [
      {
        title: "Chargebee CPQ",
        badge: "NEW",
        description:
          "Configure how quotes are generated and shared with customers. Customize the quote tracker, then route and approve workflows.",
        href: "/cpq",
      },
    ],
  },
  {
    title: "Customer Data Privacy",
    description:
      "Manage how you handle customer data privacy and configure data protection settings.",
    items: [
      {
        title: "Consent management",
        description:
          "Configure consent forms and track your customers' consent before you process personal data or send them marketing communications, feedback, surveys, etc.",
      },
      {
        title: "Personal data",
        description:
          "Configure how you handle your customers' personal data. Select personal data fields, and choose a data retention period.",
      },
    ],
  },
  {
    title: "Customer-Facing Essentials",
    description:
      "Set up your brand styles, configure customer emails and invoices, and manage your customers' checkout and self-serve portal experience.",
    items: [
      {
        title: "Brand styles",
        description:
          "Set up your brand styles, and customize emails and invoices, and manage your customers' checkout and self-serve portal experience.",
      },
      {
        title: "Languages",
        meta: "English",
      },
      {
        title: "Email notifications",
        meta: "Enabled",
      },
      {
        title: "Invoices, credit notes, and quotes",
      },
      {
        title: "Checkout and Self-Serve Portal",
        badge: "NEW",
        meta: "Checkout, Self-Serve Portal",
      },
      {
        title: "Chargebee Growth",
        badge: "NEW",
        description:
          "Deploy Price/Pricing Table and Career Experience workflows across subscription lifecycles. Personalize through A/B testing and deploy experiments without engineering dependency.",
      },
    ],
  },
  {
    title: "Revenue Recovery",
    description:
      "Recover failed payments and reduce involuntary churn. Set up how you manage payment collection for all your customers.",
    items: [
      {
        title: "Dunning for online/offline payments",
        meta: "Custom",
      },
    ],
  },
  {
    title: "Approvals",
    description:
      "Assign designated individuals to review and approve critical actions in Chargebee.",
    items: [
      {
        title: "Approval Rules for Price Points",
      },
      {
        title: "Approval Settings",
      },
    ],
  },
  {
    title: "API Keys and Events",
    description: "Manage your API keys, webhooks and events.",
    items: [
      {
        title: "API keys",
        meta: "7 keys",
      },
      {
        title: "Webhooks",
      },
      {
        title: "Event Streams",
      },
    ],
  },
  {
    title: "Advanced",
    description:
      "Collect additional data from your customers using custom fields.",
    items: [
      {
        title: "Custom fields",
        description:
          "Configure custom fields to collect additional information about customers, subscriptions, plans, and addons.",
      },
    ],
  },
  {
    title: "Test Site Data",
    description: "Manage the data on your Chargebee test site.",
    items: [
      {
        title: "Delete or Repopulate Test site data",
      },
      {
        title: "Repopulate test site data from pricing page",
      },
    ],
  },
  {
    title: "Tools",
    description:
      "Test your configuration in real time; they persist over time. Transfer configurations between sites, view pending transfers, and transfer history.",
    items: [
      {
        title: "Time Machine",
        badge: "NEW",
        icon: Clock,
        description:
          "Our powerful real-time testing tool lets you simulate the impact of the billing rules you set for your business.",
      },
      {
        title: "Transfer Configurations",
        icon: ArrowLeftRight,
        description:
          "Transfer configuration and data from one site to another.",
      },
    ],
  },
]
