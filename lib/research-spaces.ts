import { createSupabaseBrowser } from './supabase-client';
import { Paper } from '@/types/paper';

export interface ResearchSpace {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  papers: Paper[];
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseResearchSpace {
  id: string;
  owner: string;
  title: string;
  description: string;
  papers: Paper[];
  created_at: string;
  updated_at: string;
}

export class ResearchSpacesService {
  private supabase = createSupabaseBrowser();

  async getSpaces(): Promise<ResearchSpace[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('research_spaces')
      .select('*')
      .eq('owner', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching research spaces:', error);
      return [];
    }

    return data.map(space => ({
      id: space.id,
      title: space.title,
      description: space.description,
      timestamp: new Date(space.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      papers: space.papers || [],
      created_at: space.created_at,
      updated_at: space.updated_at
    }));
  }

  async createSpace(title: string, description: string, papers: Paper[] = []): Promise<ResearchSpace | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('research_spaces')
      .insert({
        owner: user.id,
        title,
        description,
        papers
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating research space:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      papers: data.papers || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async updateSpace(id: string, updates: Partial<{ title: string; description: string; papers: Paper[] }>): Promise<ResearchSpace | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('research_spaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('owner', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating research space:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      papers: data.papers || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async deleteSpace(id: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .from('research_spaces')
      .delete()
      .eq('id', id)
      .eq('owner', user.id);

    if (error) {
      console.error('Error deleting research space:', error);
      return false;
    }

    return true;
  }
}

export const researchSpacesService = new ResearchSpacesService();
