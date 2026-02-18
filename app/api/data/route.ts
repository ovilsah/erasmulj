import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json')
    const data = fs.readFileSync(dataPath, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error('Error reading data:', error)
    return NextResponse.json({ students: [], universities: [], documents: [] })
  }
}
