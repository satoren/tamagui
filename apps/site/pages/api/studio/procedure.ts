import { Database } from '@lib/supabase-types'
import { getArray, getSingle } from '@lib/supabase-utils'
import { supabaseAdmin } from '@lib/supabaseAdmin'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import * as apis from '@tamagui/studio/api'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

function setupCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin
  if (
    typeof origin === 'string' &&
    (origin.endsWith('tamagui.dev') || origin.endsWith('localhost:1421'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
}

const handler: NextApiHandler = async (req, res) => {
  setupCors(req, res)

  const supabase = createPagesServerClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    res.status(401).json({
      error: 'The user is not authenticated',
    })
    return
  }

  // uncomment to block out non-sponsors:
  // const teamsResult = await supabase.from('teams').select('id, name, is_active')
  // if (teamsResult.error) {
  //   throw teamsResult.error
  // }
  // const teams = getArray(teamsResult.data)
  // const hasAccess = teams.some((team) => team.is_active)

  const hasAccess = true

  if (!hasAccess) {
    res.status(403).json({
      error: "You don't have access to this part of studio.",
    })
    return
  }

  const procedureName = req.query.procedure

  if (req.method === 'POST') {
    if (typeof procedureName !== 'string') {
      res
        .status(400)
        .json({ error: '`procedure` query param is not provided / incorrect.' })
      return
    }

    try {
      res.json(await apis[procedureName](JSON.parse(req.body)))
      return
    } catch (error) {
      console.log(error)
      res.status(400).json({ error: 'an unknown error occurred' })
      return
    }
  }

  res.status(405).json({})
}

export default handler