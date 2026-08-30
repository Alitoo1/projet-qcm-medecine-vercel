import { NextResponse } from 'next/server'
import { apiRequireAdmin } from '@/lib/auth-utils'
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAdmin()
    if ('errorResponse' in authResult) return authResult.errorResponse

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Si BLOB_READ_WRITE_TOKEN est configuré dans Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`questions/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
      return NextResponse.json({ url: blob.url })
    }

    // Fallback autonome : Encodage Base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64String = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`
    return NextResponse.json({ url: base64String })
  } catch (error) {
    console.error('Erreur Upload Image:', error)
    return NextResponse.json({ error: 'Échec du téléversement de l\'image' }, { status: 500 })
  }
}
