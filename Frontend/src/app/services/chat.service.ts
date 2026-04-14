import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ChatThread } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: signalR.HubConnection | null = null;
  private url = "https://localhost:7023/";
  private currentThreadId: string | null = null;
  private jwtHelper = new JwtHelperService();
  private threadAdminList = new BehaviorSubject<ChatThread[] | []>([]);
  public threadAdminList$ = this.threadAdminList.asObservable();
  private threadCustomerList = new BehaviorSubject<ChatThread[] | []>([]);
  public threadCustomerList$ = this.threadCustomerList.asObservable();

  constructor(private http: HttpClient) {}

  getAllThreads(): Observable<ChatThread[]> {
    return this.http.get<ChatThread[]>(`${this.url}api/chat/threads`);
  }

  getCustomerThreads(): Observable<ChatThread[]> {
    return this.http.get<ChatThread[]>(`${this.url}api/chat/threads-by-customer`);
  }

  setCustomerThreads(customerThreads: ChatThread[]): void {
      this.threadCustomerList.next(customerThreads);
  }

  setAdminThreads(adminThreads: ChatThread[]): void {
      this.threadAdminList.next(adminThreads);
  }

  getCurrentAllThreads():ChatThread[]{
    return this.threadAdminList.getValue();
  }

  getCurrentCustomerThreads(): ChatThread[]{
    return this.threadCustomerList.getValue();
  }

  addThreadToState(thread: ChatThread): void {
      const current = this.threadCustomerList.getValue() || [];
      this.threadCustomerList.next([...current, thread]);
  }

  UpdateThreadToState(thread: ChatThread): void {
      const current = this.threadAdminList.getValue() || [];
      this.threadAdminList.next(current.map(a => a.id === thread.id ? thread : a));
  }

  connect(threadId: string): Promise<void> {
    // Se sei già connesso ad un altro thread, disconnettiti prima
    if (this.hubConnection) {
      return this.disconnect().then(() => this.startConnection(threadId));
    } else {
      return this.startConnection(threadId);
    }
  }

  private startConnection(threadId: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.url}chathub?threadId=${threadId}`)
      .withAutomaticReconnect()
      .build();

    this.currentThreadId = threadId;

    return this.hubConnection
      .start()
      .then(() => console.log(`SignalR connected to thread: ${threadId}`))
      .catch(err => {
        console.error('SignalR connection failed:', err);
        throw err;
      });
  }

  disconnect(): Promise<void> {
    if (this.hubConnection) {
      const oldHub = this.hubConnection;
      this.hubConnection = null;
      this.currentThreadId = null;
      return oldHub.stop().then(() => {
        console.log('SignalR disconnected');
      });
    }
    return Promise.resolve();
  }

  onReceiveMessage(callback: (sender: string, msg: string, time: string) => void): void {
    if (!this.hubConnection) {
      console.warn('Trying to set message handler before connection.');
      return;
    }

    this.hubConnection.off('ReceiveMessage');
    this.hubConnection.on('ReceiveMessage', callback);
  }

  onThreadClosed(callback: (threadId: string) => void) {
    if (!this.hubConnection) {
      console.warn('Trying to set message handler before connection.');
      return;
    }
    this.hubConnection.on('ThreadClosed', callback);
  }

  sendMessage(threadId: string, senderId: string, message: string): void {
    if (!this.hubConnection) {
      console.error('Cannot send message: not connected');
      return;
    }

    this.hubConnection.invoke('SendMessage', threadId, senderId, message)
      .catch(err => console.error('Error sending message:', err));
  }

  loadHistory(threadId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}api/chat/${threadId}/messages`);
  }

  createThread(userId: string, subject: string): Observable<any> {
    return this.http.post<any>(`${this.url}api/chat/threads`, {
      userId,
      subject
    });
  }

  closeThread(threadId:string):Observable<any>{
    return this.http.put<any>(`${this.url}api/chat/threads/${threadId}`, {
      threadId,
    });
  }

  chatAdmin(threadId:string):Observable<any>{
    return this.http.put<any>(`${this.url}api/chat/threadsNoAI/${threadId}`, {
      threadId,
    });
  }
}