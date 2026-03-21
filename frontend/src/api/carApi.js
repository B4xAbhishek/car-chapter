import { supabase } from '../lib/supabase';

/**
 * Fetch all approved car listings with their images directly from Supabase.
 */
export async function fetchCars() {
  if (!supabase) {
    console.warn('Supabase is not configured; returning no listings.');
    return [];
  }

  const { data: cars, error: carsError } = await supabase
    .from('cars_listings')
    .select('*')
    .eq('status', 'approved');

  if (carsError) throw carsError;
  if (!cars || cars.length === 0) return [];

  const carIds = cars.map((c) => c.id);

  const { data: images, error: imagesError } = await supabase
    .from('car_images')
    .select('car_id, image_url')
    .in('car_id', carIds);

  if (imagesError) throw imagesError;

  const imagesByCarId = (images || []).reduce((acc, img) => {
    if (!acc[img.car_id]) acc[img.car_id] = [];
    if (img.image_url) acc[img.car_id].push(img.image_url);
    return acc;
  }, {});

  return cars.map((car) => ({
    ...car,
    images: imagesByCarId[car.id] || [],
  }));
}

/**
 * Create a new car listing (status = 'pending', awaiting admin approval).
 */
export async function createCarListing(data, imageFiles = []) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.');
  }

  const { data: car, error: carError } = await supabase
    .from('cars_listings')
    .insert([{ ...data, status: 'pending' }])
    .select()
    .single();

  if (carError) throw carError;

  const uploadedImages = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const ext = file.name.split('.').pop();
    const key = `${car.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(key, file, { contentType: file.type, upsert: false });

    if (uploadError) { console.warn('Image upload failed:', uploadError); continue; }

    const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(key);
    uploadedImages.push({ car_id: car.id, image_url: urlData.publicUrl, position: i + 1 });
  }

  if (uploadedImages.length > 0) {
    const { error: imgInsertError } = await supabase.from('car_images').insert(uploadedImages);
    if (imgInsertError) throw imgInsertError;
  }

  return { ...car, images: uploadedImages.map((i) => i.image_url) };
}
