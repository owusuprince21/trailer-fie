// app/movies/page.tsx
import { redirect } from 'next/navigation';

export default function MoviesIndex() {
  redirect('/movies/popular');
}
