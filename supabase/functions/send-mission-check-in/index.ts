// Phase 1.2: Mission Check-In Email System
// Sends automated check-in emails to users with active missions due

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Mission {
  id: string
  leader_id: string
  mission_text: string
  start_date: string
  check_in_date: string
  check_in_email_sent: boolean
  leaders: {
    email: string
    name: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query missions due for check-in (active, not sent, check_in_date <= now)
    const { data: missions, error: queryError } = await supabaseClient
      .from('leader_missions')
      .select('*, leaders(email, name)')
      .eq('status', 'active')
      .eq('check_in_email_sent', false)
      .lte('check_in_date', new Date().toISOString())

    if (queryError) {
      console.error('Error querying missions:', queryError)
      throw queryError
    }

    if (!missions || missions.length === 0) {
      console.log('No missions due for check-in')
      return new Response(
        JSON.stringify({ message: 'No missions due for check-in', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${missions.length} missions due for check-in`)

    const results = []
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    for (const mission of missions as Mission[]) {
      try {
        const daysSinceStart = Math.floor(
          (new Date().getTime() - new Date(mission.start_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        const checkInUrl = `${Deno.env.get('SITE_URL')}/mission-check-in?mission=${mission.id}&action=completed`
        const extendUrl = `${Deno.env.get('SITE_URL')}/mission-check-in?mission=${mission.id}&action=extend`
        const bookingUrl = `${Deno.env.get('SITE_URL')}/booking?source=mission-help&mission=${mission.id}`

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mission Check-In</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00D9B6 0%, #00A88E 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">Check-In Time</h1>
      <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; opacity: 0.9;">How'd your first move go?</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
        Hi ${mission.leaders.name},
      </p>
      
      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
        You committed to: <strong>${mission.mission_text}</strong>
      </p>
      
      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #666666;">
        It's been ${daysSinceStart} days. How did it go?
      </p>
      
      <!-- Primary CTA -->
      <div style="text-align: center; margin: 0 0 20px 0;">
        <a href="${checkInUrl}" style="display: inline-block; padding: 16px 40px; background-color: #00D9B6; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          I Did It! ✅
        </a>
      </div>
      
      <!-- Secondary CTAs -->
      <div style="text-align: center; margin: 0 0 10px 0;">
        <a href="${extendUrl}" style="display: inline-block; padding: 12px 30px; color: #00D9B6; text-decoration: none; border: 2px solid #00D9B6; border-radius: 8px; font-weight: 500; font-size: 15px;">
          Still working on it (extend 1 week)
        </a>
      </div>
      
      <div style="text-align: center; margin: 20px 0 0 0;">
        <a href="${bookingUrl}" style="color: #666666; text-decoration: underline; font-size: 14px;">
          I need help (book a 1:1 sprint)
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999; text-align: center;">
        You're receiving this because you selected this mission in your AI Leadership Assessment.
      </p>
      <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
        <a href="${Deno.env.get('SITE_URL')}/settings" style="color: #00D9B6; text-decoration: none;">Manage notifications</a> | 
        <a href="https://themindmaker.ai" style="color: #00D9B6; text-decoration: none;">Mindmaker</a>
      </p>
    </div>
    
  </div>
</body>
</html>
        `

        // Send email via Resend
        if (resendApiKey) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Mindmaker AI Coach <coach@themindmaker.ai>',
              to: mission.leaders.email,
              subject: `Check-in: ${mission.mission_text.slice(0, 50)}${mission.mission_text.length > 50 ? '...' : ''}`,
              html: emailHtml
            })
          })

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text()
            console.error(`Failed to send email for mission ${mission.id}:`, errorData)
            results.push({ mission_id: mission.id, success: false, error: errorData })
            continue
          }

          const emailData = await emailResponse.json()
          console.log(`Email sent for mission ${mission.id}:`, emailData)
        } else {
          console.warn('RESEND_API_KEY not set, skipping email send')
        }

        // Mark mission as email sent
        const { error: updateError } = await supabaseClient
          .from('leader_missions')
          .update({
            check_in_email_sent: true,
            check_in_email_sent_at: new Date().toISOString()
          })
          .eq('id', mission.id)

        if (updateError) {
          console.error(`Failed to update mission ${mission.id}:`, updateError)
          results.push({ mission_id: mission.id, success: false, error: updateError.message })
        } else {
          results.push({ mission_id: mission.id, success: true })
        }

      } catch (error) {
        console.error(`Error processing mission ${mission.id}:`, error)
        results.push({ mission_id: mission.id, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: 'Mission check-in emails processed',
        total: missions.length,
        success: successCount,
        failed: failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-mission-check-in:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
