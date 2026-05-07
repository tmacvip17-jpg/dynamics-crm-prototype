import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: {
    id: string;
    name: string;
    permissions: {
      menus: string[];
      data_access: 'all' | 'own';
    };
  };
}

export const authApi = {
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async listRoles() {
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async listProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .order('full_name');
    if (error) throw error;
    return data;
  },

  async updateProfileRole(userId: string, roleId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role_id: roleId })
      .eq('id', userId);
    if (error) throw error;
  },

  async updateRolePermissions(roleId: string, permissions: any) {
    const { error } = await supabase
      .from('roles')
      .update({ permissions })
      .eq('id', roleId);
    if (error) throw error;
    return true;
  },

  async createRole(name: string, description: string) {
    const { data, error } = await supabase
      .from('roles')
      .insert([{ 
        name, 
        description, 
        permissions: { menus: ['dashboard'], data_access: 'own' } 
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteRole(roleId: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);
    if (error) throw error;
    return true;
  },

  async uploadAvatar(userId: string, file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await this.updateProfile(userId, { avatar_url: base64 });
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};
