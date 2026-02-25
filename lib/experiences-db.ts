import { supabase } from './supabase';

export interface ExperienceRow {
    id: number;
    title: string;
    venue: string;
    description: string;
    time: string;
    price: string;
    icon: string;
    category: string;
    bookable: boolean;
    rating: number | null;
    distance: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export type ExperienceInsert = Omit<ExperienceRow, 'id' | 'created_at' | 'updated_at' | 'active'>;
export type ExperienceUpdate = Partial<ExperienceInsert>;

export const getExperiences = async (): Promise<ExperienceRow[]> => {
    const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching experiences:', error);
        return [];
    }

    return data as ExperienceRow[];
};

export const getExperienceById = async (id: number): Promise<ExperienceRow | null> => {
    const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching experience:', error);
        return null;
    }

    return data as ExperienceRow;
};

export const createExperience = async (experience: ExperienceInsert): Promise<ExperienceRow | null> => {
    const { data, error } = await supabase
        .from('experiences')
        .insert([{
            ...experience,
            active: true,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating experience:', error);
        return null;
    }

    return data as ExperienceRow;
};

export const updateExperience = async (id: number, updates: ExperienceUpdate): Promise<ExperienceRow | null> => {
    const { data, error } = await supabase
        .from('experiences')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating experience:', error);
        return null;
    }

    return data as ExperienceRow;
};

export const deleteExperience = async (id: number): Promise<boolean> => {
    // Soft delete by setting active = false
    const { error } = await supabase
        .from('experiences')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error deleting experience:', error);
        return false;
    }

    return true;
};
