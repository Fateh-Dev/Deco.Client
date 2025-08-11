import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Article } from '../models/article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private baseUrl = 'http://localhost:5199';
  private apiUrl = `${this.baseUrl}/api/articles`;

  constructor(private http: HttpClient) { }

  private ensureImageUrl(article: Article): Article {
    if (article.imageUrl && !article.imageUrl.startsWith('http') && !article.imageUrl.startsWith('data:')) {
      // If the URL is relative, prepend the base URL
      article.imageUrl = `${this.baseUrl}${article.imageUrl.startsWith('/') ? '' : '/'}${article.imageUrl}`;
    }
    return article;
  }

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl).pipe(
      map(articles => articles.map(article => this.ensureImageUrl(article)))
    );
  }

  getArticle(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`).pipe(
      map(article => this.ensureImageUrl(article))
    );
  }

  getArticlesByCategory(categoryId: number): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map(articles => articles.map(article => this.ensureImageUrl(article)))
    );
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, article);
  }

  updateArticle(id: number, article: Article): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, article);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
