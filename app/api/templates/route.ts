import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, default_labor_hours, default_material_cost, hourly_rate } = body;
    
    const insert = db.prepare('INSERT INTO job_templates (title, description, default_labor_hours, default_material_cost, hourly_rate) VALUES (?, ?, ?, ?, ?)');
    insert.run(title, description, default_labor_hours, default_material_cost, hourly_rate);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const del = db.prepare('DELETE FROM job_templates WHERE id = ?');
      del.run(id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}