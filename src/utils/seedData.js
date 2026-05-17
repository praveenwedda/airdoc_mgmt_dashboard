import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

// Sample packages
const samplePackages = [
  { id: '1', name: 'Starter', monthlyPrice: 49, description: 'For small clinics', active: true },
  { id: '2', name: 'Pro', monthlyPrice: 149, description: 'For growing practices', active: true },
]

// Sample fixed costs
const sampleFixedCosts = [
  { name: 'Server hosting', monthlyAmount: 500 },
  { name: 'Software licenses', monthlyAmount: 200 },
  { name: 'Support staff', monthlyAmount: 3000 },
]

// Sample variable costs
const sampleVariableCosts = [
  { name: 'SMS notifications', unitDriver: 'per SMS', unitCost: 0.05 },
  { name: 'Payment gateway fees', unitDriver: 'per transaction', unitCost: 0.30 },
]

// Helper to get date N months ago
function getDateMonthsAgo(months) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().split('T')[0]
}

// Generate acquisition records for 6 months
function generateAcquisitions() {
  const sources = ['direct_meeting', 'email_campaign', 'sms_campaign', 'social_media', 'referral']
  const records = []

  for (let i = 5; i >= 0; i--) {
    // Starter package acquisitions
    records.push({
      date: getDateMonthsAgo(i),
      package: 'Starter',
      count: Math.floor(Math.random() * 10) + 5,
      source: sources[Math.floor(Math.random() * sources.length)],
      notes: 'Seed data',
    })

    // Pro package acquisitions
    records.push({
      date: getDateMonthsAgo(i),
      package: 'Pro',
      count: Math.floor(Math.random() * 5) + 2,
      source: sources[Math.floor(Math.random() * sources.length)],
      notes: 'Seed data',
    })
  }

  return records
}

// Generate churn records for 6 months
function generateChurn() {
  const reasons = ['pricing', 'product_issue', 'competitor', 'no_longer_needed', 'other']
  const records = []

  for (let i = 5; i >= 0; i--) {
    // Some months have churn, some don't
    if (Math.random() > 0.3) {
      records.push({
        date: getDateMonthsAgo(i),
        package: Math.random() > 0.5 ? 'Starter' : 'Pro',
        count: Math.floor(Math.random() * 3) + 1,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        notes: 'Seed data',
      })
    }
  }

  return records
}

// Sample meetings
const sampleMeetings = [
  {
    type: 'existing',
    date: getDateMonthsAgo(1),
    company: 'Sydney Medical Centre',
    attendees: 'Dr. Smith, Jane Doe',
    summary: 'Quarterly review meeting. Client is happy with the service and considering upgrade to Pro plan.',
    sentiment: 'very_positive',
    actionItems: 'Send Pro plan proposal, Schedule demo of new features',
    followUpDate: getDateMonthsAgo(-1),
  },
  {
    type: 'prospect',
    date: getDateMonthsAgo(0),
    company: 'Melbourne Health Clinic',
    industry: 'Healthcare',
    contactPerson: 'Dr. Johnson',
    contactDesignation: 'Practice Manager',
    contactEmail: 'johnson@mhc.com.au',
    contactPhone: '+61 400 123 456',
    summary: 'Initial discovery call. Interested in digitizing patient records.',
    interestLevel: 'very_interested',
    nextSteps: 'Send pricing proposal and schedule product demo',
    followUpDate: getDateMonthsAgo(-1),
  },
  {
    type: 'prospect',
    date: getDateMonthsAgo(2),
    company: 'Brisbane Dental Group',
    industry: 'Dental',
    contactPerson: 'Sarah Williams',
    contactDesignation: 'Operations Director',
    contactEmail: 'sarah@bdg.com.au',
    contactPhone: '+61 400 789 012',
    summary: 'Product demonstration completed. They need to discuss with partners.',
    interestLevel: 'interested',
    nextSteps: 'Follow up in 2 weeks',
    followUpDate: getDateMonthsAgo(0),
  },
]

// Sample email campaign
const sampleCampaign = {
  type: 'email',
  name: 'Q1 Newsletter Campaign',
  startDate: getDateMonthsAgo(2),
  endDate: getDateMonthsAgo(2),
  reached: 500,
  delivered: 485,
  responses: 42,
  conversions: 5,
  cost: 150,
  notes: 'Quarterly newsletter with product updates and industry news',
}

// Sample social media campaigns
const sampleSocialCampaigns = [
  {
    platform: 'meta',
    campaignName: 'Brand Awareness - Healthcare Professionals',
    postTitle: 'Transform Your Practice with AirDoc',
    date: getDateMonthsAgo(1),
    impressions: 15000,
    reach: 8500,
    reactions: 320,
    comments: 45,
    messages: 12,
    linkClicks: 180,
    spend: 500,
    notes: 'Targeted at healthcare professionals in AU',
    source: 'manual',
  },
  {
    platform: 'linkedin',
    campaignName: 'Lead Generation - Medical Directors',
    postTitle: 'Streamline Your Clinical Operations',
    date: getDateMonthsAgo(0),
    impressions: 8000,
    reach: 4200,
    reactions: 150,
    comments: 25,
    messages: 8,
    linkClicks: 95,
    spend: 350,
    notes: 'B2B campaign targeting decision makers',
    source: 'manual',
  },
]

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...')

    // 1. Seed configuration
    console.log('Seeding configuration...')
    await setDoc(doc(db, 'config', 'app'), {
      appName: 'AirDoc',
      packages: samplePackages,
      fixedCosts: sampleFixedCosts,
      variableCosts: sampleVariableCosts,
      targets: {
        mrrTarget: 50000,
        expenditureBaseline: 5000,
        newCustomerTarget: 20,
      },
      updatedAt: serverTimestamp(),
    })

    // 2. Seed acquisitions
    console.log('Seeding acquisitions...')
    const acquisitions = generateAcquisitions()
    for (const acq of acquisitions) {
      await addDoc(collection(db, 'acquisitions'), {
        ...acq,
        createdAt: serverTimestamp(),
      })
    }

    // 3. Seed churn
    console.log('Seeding churn records...')
    const churnRecords = generateChurn()
    for (const churn of churnRecords) {
      await addDoc(collection(db, 'churn'), {
        ...churn,
        createdAt: serverTimestamp(),
      })
    }

    // 4. Seed meetings
    console.log('Seeding meetings...')
    for (const meeting of sampleMeetings) {
      await addDoc(collection(db, 'meetings'), {
        ...meeting,
        createdAt: serverTimestamp(),
      })
    }

    // 5. Seed campaigns
    console.log('Seeding campaigns...')
    await addDoc(collection(db, 'campaigns'), {
      ...sampleCampaign,
      createdAt: serverTimestamp(),
    })

    // 6. Seed social campaigns
    console.log('Seeding social campaigns...')
    for (const campaign of sampleSocialCampaigns) {
      await addDoc(collection(db, 'social_campaigns'), {
        ...campaign,
        createdAt: serverTimestamp(),
      })
    }

    console.log('Database seeding completed successfully!')
    return { success: true, message: 'Database seeded successfully!' }
  } catch (error) {
    console.error('Error seeding database:', error)
    return { success: false, message: error.message }
  }
}
