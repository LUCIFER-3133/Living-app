'use client';

import { useState } from 'react';
import { Loader2, Trash2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, slugify } from '@/lib/utils';
import { deleteDemoVideo, toggleDemoVideoPublished } from '@/lib/actions/demoVideos';
import type { DemoVideo } from '@/types/database';

const CATEGORIES = ['Hatha', 'Vinyasa', 'Ashtanga', 'Prenatal', 'Power Yoga', 'Meditation', 'Pranayama', 'General'];

export default function DemoVideoManager({ initialVideos }: { initialVideos: DemoVideo[] }) {
  const supabase = createClient();
  const [videos, setVideos] = useState(initialVideos);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile) {
      setError('Choose a video file to upload.');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      const stamp = Date.now();
      const videoPath = `videos/${stamp}-${slugify(videoFile.name.replace(/\.[^.]+$/, ''))}.${videoFile.name.split('.').pop()}`;

      const { error: uploadErr } = await supabase.storage.from('demo-videos').upload(videoPath, videoFile, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadErr) throw uploadErr;
      const { data: videoUrl } = supabase.storage.from('demo-videos').getPublicUrl(videoPath);

      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        const thumbPath = `thumbnails/${stamp}-${slugify(thumbFile.name.replace(/\.[^.]+$/, ''))}.${thumbFile.name.split('.').pop()}`;
        const { error: thumbErr } = await supabase.storage.from('demo-videos').upload(thumbPath, thumbFile, { upsert: false });
        if (!thumbErr) {
          thumbnailUrl = supabase.storage.from('demo-videos').getPublicUrl(thumbPath).data.publicUrl;
        }
      }

      const { data: row, error: insertErr } = await supabase
        .from('demo_videos')
        .insert({
          title,
          category,
          description: description || null,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl,
          is_published: true,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertErr || !row) throw insertErr || new Error('Could not save video.');

      setVideos((prev) => [row as DemoVideo, ...prev]);
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbFile(null);
      (document.getElementById('video-file-input') as HTMLInputElement | null)?.value && ((document.getElementById('video-file-input') as HTMLInputElement).value = '');
      (document.getElementById('thumb-file-input') as HTMLInputElement | null)?.value && ((document.getElementById('thumb-file-input') as HTMLInputElement).value = '');
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function togglePublish(v: DemoVideo) {
    const nextPublished = !v.is_published;
    try {
      await toggleDemoVideoPublished(v.id, nextPublished);
      setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, is_published: nextPublished } : x)));
    } catch (err: any) {
      setError(err.message || 'Could not update the video.');
    }
  }

  async function remove(v: DemoVideo) {
    if (!confirm(`Delete "${v.title}"? This removes it — and its uploaded video/thumbnail files — permanently.`)) return;
    try {
      // Server action, not a client-side delete: it also removes the actual
      // video/thumbnail files from storage, not just this row.
      await deleteDemoVideo(v.id);
      setVideos((prev) => prev.filter((x) => x.id !== v.id));
    } catch (err: any) {
      setError(err.message || 'Could not delete the video.');
    }
  }

  return (
    <div className="space-y-12">
      <form onSubmit={handleUpload} className="max-w-lg space-y-4 glass-card p-6">
        <h2 className="font-display text-xl">Upload a new session</h2>

        <div>
          <label className="text-sm font-medium text-ink">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="Morning Hatha Flow — Full Session" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Video file</label>
          <input
            id="video-file-input"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            required
            className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:text-canvas"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Thumbnail image (optional)</label>
          <input
            id="thumb-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:text-canvas"
          />
        </div>

        {error && <p className="text-sm text-moss">{error}</p>}

        <button type="submit" disabled={uploading} className="btn-primary w-full justify-center">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <><UploadCloud size={16} /><span>Upload session</span></>}
        </button>
      </form>

      <div>
        <h2 className="font-display text-xl">Uploaded sessions</h2>
        <div className="mt-4 space-y-3">
          {videos.length === 0 && <p className="text-sm text-ink/55">No videos uploaded yet.</p>}
          {videos.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-4 glass-card p-4">
              <div>
                <p className="font-semibold text-ink">{v.title}</p>
                <p className="text-xs text-ink/50">{v.category} · {formatDate(v.created_at)} · {v.is_published ? 'Published' : 'Hidden'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => togglePublish(v)} className="rounded-full border border-ink/20 p-2 hover:border-ink" aria-label={v.is_published ? 'Unpublish' : 'Publish'}>
                  {v.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => remove(v)} className="rounded-full border border-ink/20 p-2 text-moss hover:border-moss" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
