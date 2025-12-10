import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getShowcaseVehicles, addShowcaseVehicle, deleteShowcaseVehicle, saveShowcaseVehicles } from '@/lib/s3';
import { MAX_SHOWCASE_VEHICLES } from '@/lib/validation';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicles = await getShowcaseVehicles();
    return NextResponse.json({ vehicles, maxVehicles: MAX_SHOWCASE_VEHICLES });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json({ error: 'Failed to fetch showcase' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const vehicleData = JSON.parse(formData.get('data') as string);
    const imageFile = formData.get('image') as File | null;

    let imageBuffer: { buffer: Buffer; filename: string; contentType: string } | undefined;
    
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      imageBuffer = {
        buffer: Buffer.from(bytes),
        filename: imageFile.name,
        contentType: imageFile.type,
      };
    }

    const vehicle = await addShowcaseVehicle(vehicleData, imageBuffer);
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Maximum vehicles reached' }, { status: 400 });
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error('Error adding showcase vehicle:', error);
    return NextResponse.json({ error: 'Failed to add vehicle' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('id');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    const success = await deleteShowcaseVehicle(vehicleId);
    
    if (!success) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting showcase vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}

// Seed sample data
export async function PUT() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sampleVehicles = [
      {
        id: 'sample-1',
        year: '2024',
        make: 'BMW',
        model: 'M440i',
        trim: 'xDrive Convertible',
        price: '$72,500',
        mileage: '1,200 km',
        featured: true,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop',
      },
      {
        id: 'sample-2',
        year: '2023',
        make: 'Mercedes-Benz',
        model: 'C300',
        trim: '4MATIC Sedan',
        price: '$58,900',
        mileage: '12,500 km',
        featured: true,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop',
      },
      {
        id: 'sample-3',
        year: '2024',
        make: 'Audi',
        model: 'Q5',
        trim: 'Progressiv',
        price: '$54,200',
        mileage: '5,800 km',
        featured: false,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop',
      },
      {
        id: 'sample-4',
        year: '2023',
        make: 'Toyota',
        model: 'RAV4',
        trim: 'XLE Premium',
        price: '$42,800',
        mileage: '18,200 km',
        featured: false,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=600&h=400&fit=crop',
      },
      {
        id: 'sample-5',
        year: '2024',
        make: 'Honda',
        model: 'Accord',
        trim: 'Sport',
        price: '$38,500',
        mileage: '3,100 km',
        featured: false,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=600&h=400&fit=crop',
      },
      {
        id: 'sample-6',
        year: '2023',
        make: 'Ford',
        model: 'F-150',
        trim: 'Lariat',
        price: '$65,900',
        mileage: '8,400 km',
        featured: true,
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&h=400&fit=crop',
      },
    ];

    await saveShowcaseVehicles(sampleVehicles);
    return NextResponse.json({ success: true, vehicles: sampleVehicles });
  } catch (error) {
    console.error('Error seeding showcase:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}

