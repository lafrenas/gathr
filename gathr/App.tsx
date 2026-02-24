import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from './lib/supabase';

type EventRow = {
  id: number;
  created_at: string;
  title: string;
  category: string;
  area: string;
  exact_location: string;
  exact_time: string;
  host_name: string;
};

type JoinRequestRow = {
  id: number;
  event_id: number;
  requester_name: string;
  status: 'pending' | 'approved' | 'rejected';
};

type EventRatingRow = {
  id: number;
  event_id: number;
  rater_name: string;
  rated_name: string;
  skill: number;
  friendliness: number;
  reliability: number;
  communication: number;
  boundary_respect: number;
  skill_context: string;
  comment?: string;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState('Ignas');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [ratings, setRatings] = useState<EventRatingRow[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sports');
  const [activityType, setActivityType] = useState('Basketball');
  const [area, setArea] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [exactTime, setExactTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [ratingEventId, setRatingEventId] = useState<number | null>(null);
  const [ratingTargetName, setRatingTargetName] = useState('');
  const [skillRating, setSkillRating] = useState('5');
  const [friendlinessRating, setFriendlinessRating] = useState('5');
  const [reliabilityRating, setReliabilityRating] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [communicationRating, setCommunicationRating] = useState('5');
  const [boundaryRating, setBoundaryRating] = useState('5');
  const [skillContext, setSkillContext] = useState('General');

  const activityOptions: Record<string, string[]> = {
    Sports: ['Basketball', 'Football', 'Tennis', 'Running', 'Gym'],
    Social: ['Coffee', 'Dinner', 'Walk', 'Board Games', 'Networking'],
  };

  const loadData = async () => {
    setBusy(true);
    setError(null);

    const [{ data: eventsData, error: eventsError }, { data: reqData, error: reqError }, { data: ratingData, error: ratingError }] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('join_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('event_ratings').select('*').order('created_at', { ascending: false }),
    ]);

    if (eventsError) {
      setBusy(false);
      return setError(eventsError.message);
    }
    if (reqError) {
      setBusy(false);
      return setError(reqError.message);
    }
    if (ratingError) {
      setBusy(false);
      return setError(ratingError.message);
    }

    setEvents((eventsData ?? []) as EventRow[]);
    setRequests((reqData ?? []) as JoinRequestRow[]);
    setRatings((ratingData ?? []) as EventRatingRow[]);
    setBusy(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingForMyHostedEvents = useMemo(() => {
    const hostedEventIds = new Set(
      events.filter((e) => e.host_name.toLowerCase() === currentUser.trim().toLowerCase()).map((e) => e.id)
    );
    return requests.filter((r) => r.status === 'pending' && hostedEventIds.has(r.event_id));
  }, [events, requests, currentUser]);

  const hostRatingStats = useMemo(() => {
    const byHost: Record<string, { trust: number; skill: number; count: number; friendliness: number; reliability: number; communication: number; boundary: number }> = {};

    const grouped: Record<string, EventRatingRow[]> = {};
    for (const r of ratings) {
      const key = r.rated_name.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    for (const [hostKey, hostRatings] of Object.entries(grouped)) {
      const count = hostRatings.length;
      const skill = hostRatings.reduce((s, r) => s + r.skill, 0) / count;
      const friendliness = hostRatings.reduce((s, r) => s + r.friendliness, 0) / count;
      const reliability = hostRatings.reduce((s, r) => s + r.reliability, 0) / count;
      const communication = hostRatings.reduce((s, r) => s + (r.communication ?? 5), 0) / count;
      const boundary = hostRatings.reduce((s, r) => s + (r.boundary_respect ?? 5), 0) / count;
      const trust = friendliness * 0.35 + reliability * 0.35 + communication * 0.2 + boundary * 0.1;
      byHost[hostKey] = {
        trust,
        skill,
        count,
        friendliness,
        reliability,
        communication,
        boundary,
      };
    }

    return byHost;
  }, [ratings]);

  const createEvent = async () => {
    if (!title.trim() || !area.trim() || !exactLocation.trim() || !exactTime.trim()) return;

    setError(null);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      category: `${category.trim()}:${activityType.trim()}`,
      area: area.trim(),
      exact_location: exactLocation.trim(),
      exact_time: exactTime.trim(),
      host_name: currentUser.trim() || 'Anonymous',
    });

    if (error) return setError(error.message);

    setTitle('');
    setCategory('Sports');
    setActivityType('Basketball');
    setArea('');
    setExactLocation('');
    setExactTime('');
    await loadData();
  };

  const requestJoin = async (eventId: number) => {
    const name = currentUser.trim();
    if (!name) return setError('Set your name first.');

    setError(null);

    const existing = requests.find(
      (r) => r.event_id === eventId && r.requester_name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (existing.status !== 'pending') {
        const { error } = await supabase.from('join_requests').update({ status: 'pending' }).eq('id', existing.id);
        if (error) return setError(error.message);
      }
      await loadData();
      return;
    }

    const { error } = await supabase.from('join_requests').insert({
      event_id: eventId,
      requester_name: name,
      status: 'pending',
    });

    if (error) return setError(error.message);
    await loadData();
  };

  const setRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    setError(null);
    const { error } = await supabase.from('join_requests').update({ status }).eq('id', requestId);
    if (error) return setError(error.message);
    await loadData();
  };

  const openRatingForm = (eventId: number, ratedName: string) => {
    setRatingEventId(eventId);
    setRatingTargetName(ratedName);
    const ev = events.find((e) => e.id === eventId);
    setSkillRating('5');
    setFriendlinessRating('5');
    setReliabilityRating('5');
    setCommunicationRating('5');
    setBoundaryRating('5');
    const parsedActivity = ev?.category?.includes(':') ? ev.category.split(':')[1].trim() : ev?.category?.trim();
    setSkillContext(parsedActivity || 'General');
    setRatingComment('');
  };

  const submitRating = async () => {
    const rater = currentUser.trim();
    if (!rater || !ratingEventId || !ratingTargetName) return;
    setError(null);

    const skill = Number(skillRating);
    const friendliness = Number(friendlinessRating);
    const reliability = Number(reliabilityRating);
    const communication = Number(communicationRating);
    const boundary_respect = Number(boundaryRating);

    if (
      !Number.isInteger(skill) || skill < 1 || skill > 5 ||
      !Number.isInteger(friendliness) || friendliness < 1 || friendliness > 5 ||
      !Number.isInteger(reliability) || reliability < 1 || reliability > 5 ||
      !Number.isInteger(communication) || communication < 1 || communication > 5 ||
      !Number.isInteger(boundary_respect) || boundary_respect < 1 || boundary_respect > 5
    ) {
      return setError('Ratings must be numbers 1 to 5.');
    }

    const { error } = await supabase.from('event_ratings').upsert(
      {
        event_id: ratingEventId,
        rater_name: rater,
        rated_name: ratingTargetName,
        skill,
        friendliness,
        reliability,
        communication,
        boundary_respect,
        skill_context: skillContext.trim() || 'General',
        comment: ratingComment.trim() || null,
      },
      { onConflict: 'event_id,rater_name,rated_name' }
    );

    if (error) return setError(error.message);

    setRatingEventId(null);
    setRatingTargetName('');
    setRatingComment('');
    await loadData();
  };

  const clearTestData = async () => {
    setError(null);
    setBusy(true);

    const r1 = await supabase.from('event_ratings').delete().neq('id', -1);
    if (r1.error) {
      setBusy(false);
      return setError(r1.error.message);
    }

    const r2 = await supabase.from('join_requests').delete().neq('id', -1);
    if (r2.error) {
      setBusy(false);
      return setError(r2.error.message);
    }

    const r3 = await supabase.from('events').delete().neq('id', -1);
    if (r3.error) {
      setBusy(false);
      return setError(r3.error.message);
    }

    await loadData();
    setBusy(false);
  };

  const openMap = (query: string) => {
    const encoded = encodeURIComponent(query);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>gathr</Text>
      <Text style={styles.subtitle}>Create events. Request to join. Host approves before exact details unlock.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You are</Text>
        <TextInput
          style={styles.input}
          value={currentUser}
          onChangeText={setCurrentUser}
          placeholder="Your display name"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {!!error && <Text style={styles.error}>Backend: {error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Debug</Text>
        <Text style={styles.meta}>Status: {busy ? 'Loading…' : 'Ready'}</Text>
        <Text style={styles.meta}>Events: {events.length} • Requests: {requests.length} • Ratings: {ratings.length}</Text>
        <View style={styles.rowGap}>
          <TouchableOpacity style={[styles.mapBtn, { flex: 1 }]} onPress={loadData}>
            <Text style={styles.mapBtnText}>Refresh data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={clearTestData}>
            <Text style={styles.approveBtnText}>Clear test data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {ratingEventId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate {ratingTargetName}</Text>
          <Text style={styles.ratingGuide}>1 = poor • 3 = okay • 5 = excellent</Text>
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={submitRating}>
              <Text style={styles.approveBtnText}>Submit rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setRatingEventId(null)}>
              <Text style={styles.approveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.ratingLabel}>Skill</Text>
          <Text style={styles.ratingHelp}>How capable were they at the activity?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={skillRating} onChangeText={setSkillRating} />
          <TextInput style={styles.input} placeholder="Skill context (e.g., Basketball)" placeholderTextColor="#9ca3af" value={skillContext} onChangeText={setSkillContext} />

          <Text style={styles.ratingLabel}>Friendliness</Text>
          <Text style={styles.ratingHelp}>Were they respectful, kind, and good to be around?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={friendlinessRating} onChangeText={setFriendlinessRating} />

          <Text style={styles.ratingLabel}>Reliability</Text>
          <Text style={styles.ratingHelp}>Did they show up on time and follow through?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={reliabilityRating} onChangeText={setReliabilityRating} />

          <Text style={styles.ratingLabel}>Communication</Text>
          <Text style={styles.ratingHelp}>Were they clear and responsive before/during event?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={communicationRating} onChangeText={setCommunicationRating} />

          <Text style={styles.ratingLabel}>Boundary respect</Text>
          <Text style={styles.ratingHelp}>Did they respect boundaries and personal comfort?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={boundaryRating} onChangeText={setBoundaryRating} />

          <Text style={styles.ratingLabel}>Comment (optional)</Text>
          <TextInput style={styles.input} placeholder="Short feedback" placeholderTextColor="#9ca3af" value={ratingComment} onChangeText={setRatingComment} />
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={submitRating}>
              <Text style={styles.approveBtnText}>Submit rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setRatingEventId(null)}>
              <Text style={styles.approveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create event</Text>
        <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />

        <Text style={styles.ratingLabel}>Category</Text>
        <View style={styles.rowGapWrap}>
          {Object.keys(activityOptions).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chipBtn, category === cat && styles.chipBtnActive]}
              onPress={() => {
                setCategory(cat);
                setActivityType(activityOptions[cat][0]);
              }}
            >
              <Text style={styles.chipBtnText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>Activity</Text>
        <View style={styles.rowGapWrap}>
          {(activityOptions[category] ?? ['General']).map((act) => (
            <TouchableOpacity
              key={act}
              style={[styles.chipBtn, activityType === act && styles.chipBtnActive]}
              onPress={() => setActivityType(act)}
            >
              <Text style={styles.chipBtnText}>{act}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Public area (shown to everyone)" placeholderTextColor="#9ca3af" value={area} onChangeText={setArea} />
        <TextInput style={styles.input} placeholder="Exact location (approved only)" placeholderTextColor="#9ca3af" value={exactLocation} onChangeText={setExactLocation} />
        <TextInput style={styles.input} placeholder="Exact time (approved only)" placeholderTextColor="#9ca3af" value={exactTime} onChangeText={setExactTime} />

        <TouchableOpacity style={styles.primaryBtn} onPress={createEvent}>
          <Text style={styles.primaryBtnText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {pendingForMyHostedEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending approvals</Text>
          {pendingForMyHostedEvents.map((r) => {
            const event = events.find((e) => e.id === r.event_id);
            return (
              <View key={r.id} style={styles.pendingItem}>
                <Text style={styles.eventTitle}>{event?.title ?? 'Event'} • {r.requester_name}</Text>
                <View style={styles.rowGap}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => setRequestStatus(r.id, 'approved')}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => setRequestStatus(r.id, 'rejected')}>
                    <Text style={styles.approveBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Event feed</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setShowAllEvents((v) => !v)}>
          <Text style={styles.mapBtnText}>{showAllEvents ? 'Show latest 8 only' : 'Show all events'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {(showAllEvents ? events : events.slice(0, 8)).map((item) => {
          const isHost = item.host_name.toLowerCase() === currentUser.trim().toLowerCase();
          const myReq = requests.find(
            (r) => r.event_id === item.id && r.requester_name.toLowerCase() === currentUser.trim().toLowerCase()
          );
          const approved = isHost || myReq?.status === 'approved';

          return (
            <View key={item.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.category.replace(':', ' • ')} • Host: {item.host_name}</Text>
              {(() => {
                const stat = hostRatingStats[item.host_name.toLowerCase()];
                if (!stat) return <Text style={styles.meta}>Trust: New • Skill: New</Text>;
                const recent = ratings.find((r) => r.rated_name.toLowerCase() === item.host_name.toLowerCase() && !!r.comment?.trim());
                return (
                  <>
                    <Text style={styles.meta}>Trust: ⭐ {stat.trust.toFixed(1)} ({stat.count})</Text>
                    <Text style={styles.meta}>Skill: ⭐ {stat.skill.toFixed(1)} • F {stat.friendliness.toFixed(1)} • R {stat.reliability.toFixed(1)} • C {stat.communication.toFixed(1)} • B {stat.boundary.toFixed(1)}</Text>
                    {stat.reliability < 3.2 && <Text style={styles.warnBadge}>⚠ Low reliability</Text>}
                    {stat.boundary < 3.2 && <Text style={styles.warnBadge}>⚠ Boundary concerns</Text>}
                    {recent?.comment ? <Text style={styles.reviewSnippet}>“{recent.comment}”</Text> : null}
                  </>
                );
              })()}
              <Text style={styles.meta}>Area: {item.area}</Text>

              <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(approved ? item.exact_location : item.area)}>
                <Text style={styles.mapBtnText}>{approved ? 'Open exact location in map' : 'Open rough area in map'}</Text>
              </TouchableOpacity>

              {approved ? (
                <View style={styles.revealedBox}>
                  <Text style={styles.revealedText}>📍 {item.exact_location}</Text>
                  <Text style={styles.revealedText}>🕒 {item.exact_time}</Text>
                </View>
              ) : (
                <Text style={styles.hiddenText}>🔒 Exact location/time hidden until host approval</Text>
              )}

              {!isHost && !myReq && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => requestJoin(item.id)}>
                  <Text style={styles.primaryBtnText}>Request to Join</Text>
                </TouchableOpacity>
              )}

              {!isHost && myReq?.status === 'pending' && <Text style={styles.pendingText}>Request pending host approval…</Text>}
              {!isHost && myReq?.status === 'approved' && <Text style={styles.approvedText}>Approved ✅</Text>}
              {!isHost && myReq?.status === 'rejected' && <Text style={styles.rejectedText}>Request rejected</Text>}

              {approved && !isHost && (() => {
                const alreadyRated = ratings.some(
                  (r) => r.event_id === item.id && r.rater_name.toLowerCase() === currentUser.trim().toLowerCase() && r.rated_name.toLowerCase() === item.host_name.toLowerCase()
                );
                if (alreadyRated) return <Text style={styles.approvedText}>You rated this host ✅</Text>;
                return (
                  <TouchableOpacity style={styles.approveBtn} onPress={() => openRatingForm(item.id, item.host_name)}>
                    <Text style={styles.approveBtnText}>Rate host</Text>
                  </TouchableOpacity>
                );
              })()}

              <Text style={styles.ratingHint}>After event: rate trust + skill</Text>
            </View>
          );
        })}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  brand: { color: '#f9fafb', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginBottom: 12 },
  error: { color: '#fca5a5', marginBottom: 8 },
  card: {
    backgroundColor: '#111827', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  cardTitle: { color: '#f9fafb', fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: '#1f2937', color: '#f9fafb', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 8,
  },
  list: { paddingBottom: 24 },
  eventCard: {
    backgroundColor: '#111827', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  eventTitle: { color: '#f9fafb', fontWeight: '700', fontSize: 16 },
  meta: { color: '#9ca3af', marginTop: 2 },
  hiddenText: { color: '#fbbf24', marginTop: 8 },
  revealedBox: {
    marginTop: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#334155',
  },
  revealedText: { color: '#bfdbfe' },
  primaryBtn: {
    marginTop: 10, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  pendingText: { marginTop: 10, color: '#fbbf24', fontWeight: '600' },
  approvedText: { marginTop: 10, color: '#4ade80', fontWeight: '700' },
  rejectedText: { marginTop: 10, color: '#f87171', fontWeight: '700' },
  ratingHint: { marginTop: 8, color: '#94a3b8', fontSize: 12 },
  pendingItem: { marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rowGapWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chipBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  chipBtnActive: { backgroundColor: '#2563eb' },
  chipBtnText: { color: '#fff', fontWeight: '600' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  mapBtn: {
    marginTop: 10, backgroundColor: '#374151', paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  mapBtnText: { color: '#e5e7eb', fontWeight: '600' },
  ratingGuide: { color: '#cbd5e1', marginBottom: 8 },
  ratingLabel: { color: '#f1f5f9', fontWeight: '700', marginTop: 2 },
  ratingHelp: { color: '#94a3b8', marginBottom: 6, fontSize: 12 },
  warnBadge: { color: '#fca5a5', marginTop: 6, fontWeight: '700' },
  reviewSnippet: { color: '#cbd5e1', marginTop: 6, fontStyle: 'italic' },
});
