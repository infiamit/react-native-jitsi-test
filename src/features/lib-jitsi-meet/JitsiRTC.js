import React from 'react';
import JitsiMeetJS, {
  JitsiConferenceEvents,
  JitsiConnectionQualityEvents,
  JitsiConnectionEvents,
} from './';
import {StyleSheet, View, Button, TextInput} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const jitsiConfig = {
  hosts: {
    domain: 'beta.meet.jit.si',
    muc: 'conference.beta.meet.jit.si',
  },
  useStunTurn: true,
  bosh: 'https://beta.meet.jit.si/http-bind',
  websocket: 'wss://beta.meet.jit.si/xmpp-websocket',
  clientNode: 'http://jitsi.org/jitsimeet',
  openBridgeChannel: 'websocket',
};

class JitsiRTC extends React.Component {
  state = {
    tracks: [],
  };
  connection = undefined;
  room = undefined;
  componentDidMount() {
    JitsiMeetJS.init(jitsiConfig);

    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);
  }

  connect(roomId) {
    navigator.mediaDevices.enumerateDevices().then(sourceInfos => {
      console.log('sourceInfos', sourceInfos);

      navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
        console.log('stream', stream);

        this.connection = new JitsiMeetJS.JitsiConnection(
          null,
          null,
          jitsiConfig,
        );

        this.connection.addEventListener(
          JitsiConnectionEvents.CONNECTION_ESTABLISHED,
          event => this.onConnectionEstablished(event, roomId),
        );
        this.connection.addEventListener(
          JitsiConnectionEvents.CONNECTION_FAILED,
          event => this.onConnectionFailed(event),
        );
        this.connection.addEventListener(
          JitsiConnectionEvents.CONNECTION_DISCONNECTED,
          () => this.onConnectionDisconnected(),
        );
        console.log('connecting>>>>>>>>>');
        this.connection.connect();
      });
    });
  }

  onConnectionEstablished(event, roomId) {
    console.log('connection established', event);

    const configWithBosh = {
      ...jitsiConfig,
      bosh: `${jitsiConfig.bosh}?room=${roomId}`,
    };

    this.room = this.connection.initJitsiConference(roomId, configWithBosh);

    this.room.on(JitsiConferenceEvents.CONFERENCE_JOINED, () =>
      this.onConferenceJoined(),
    );
    this.room.on(JitsiConferenceEvents.CONFERENCE_LEFT, () =>
      this.onConferenceLeft(),
    );
    this.room.on(JitsiConferenceEvents.CONNECTION_INTERRUPTED, () =>
      this.onConnectionInterrupted(),
    );
    this.room.on(JitsiConferenceEvents.CONNECTION_RESTORED, () =>
      this.onConnectionRestored(),
    );
    this.room.on(JitsiConferenceEvents.USER_JOINED, userId =>
      this.onUserJoined(userId),
    );
    this.room.on(JitsiConferenceEvents.USER_LEFT, userId =>
      this.onUserLeft(userId),
    );
    this.room.on(JitsiConnectionQualityEvents.LOCAL_STATS_UPDATED, stats =>
      this.onLocalStatsUpdated(stats),
    );
    this.room.on(
      JitsiConnectionQualityEvents.REMOTE_STATS_UPDATED,
      (id, stats) => this.onRemoteStatsUpdated(id, stats),
    );
    this.room.on(
      JitsiConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
      (id, connectionStatus) =>
        this.onParticipantConnectionStatusChanged(id, connectionStatus),
    );
    this.room.on(JitsiConferenceEvents.TRACK_ADDED, track =>
      this.onTrackAdded(track),
    );
    this.room.on(JitsiConferenceEvents.TRACK_REMOVED, track =>
      this.onTrackRemoved(track),
    );
    this.room.on(JitsiConferenceEvents.TRACK_MUTE_CHANGED, track =>
      this.onTrackMuteChanged(track),
    );
    this.room.on(
      JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
      (userId, audioLevel) => this.onTrackAudioLevelChanged(userId, audioLevel),
    );

    this.room.join();
  }

  onConnectionFailed(event) {
    console.log('connection failed', event);
  }

  onConnectionDisconnected() {
    this.connection.removeEventListener(
      JitsiConnectionEvents.CONNECTION_ESTABLISHED,
      event => this.onConnectionEstablished(event),
    );
    this.connection.removeEventListener(
      JitsiConnectionEvents.CONNECTION_FAILED,
      event => this.onConnectionFailed(event),
    );
    this.connection.removeEventListener(
      JitsiConnectionEvents.CONNECTION_DISCONNECTED,
      () => this.onConnectionDisconnected(),
    );
  }

  onConferenceJoined() {
    console.log('conference joined', this.room.myUserId());

    JitsiMeetJS.createLocalTracks({
      devices: ['audio'],
      // micDeviceId: 'audio-1',
      // micDeviceId: 'com.apple.avfoundation.avcapturedevice.built-in_audio:0',
    })
      .then(async localTracks => {
        console.log('local tracks', localTracks);

        for (const localTrack of localTracks) {
          this.room.addTrack(localTrack);
          console.log('local tracks>>>>>>>>>>', localTrack.stream.toURL());
          console.log('local tracks>>>>>>>>>>', localTrack.streamURL);
        }
      })
      .catch(error => {
        console.log('createLocalTracks error', error);
      });

    setTimeout(() => {
      this.room.setDisplayName('amit!!!');
      this.room.sendTextMessage('Sent by amit');
    }, 3000);
  }

  onConferenceLeft() {
    console.log('conference left');
  }

  onConnectionInterrupted() {
    console.log('connection interrupted');
  }

  onConnectionRestored() {
    console.log('connection restored');
  }

  onUserJoined(userId) {
    console.log('user joined', userId);
  }

  onUserLeft(userId) {
    console.log('user left', userId);
  }

  onLocalStatsUpdated(stats) {
    console.log('local stats updated', stats);
  }

  onRemoteStatsUpdated(id, stats) {
    console.log('remote stats updated', {
      id,
      stats,
    });
  }

  onParticipantConnectionStatusChanged(id, connectionStatus) {
    console.log('participant connection status changed', {
      id,
      connectionStatus,
    });
  }

  onTrackAdded(track) {
    console.log(`${track.isLocal() ? 'LOCAL' : 'REMOTE'} track added`, track);
    this.setState({tracks: [...this.state.tracks, track]});
  }

  onTrackRemoved(track) {
    console.log('track removed', track);
  }

  onTrackMuteChanged(track) {
    console.log('track mute changed', track);
  }

  onTrackAudioLevelChanged(userId, audioLevel) {
    console.log('track audio level changed', {
      userId,
      audioLevel,
    });
  }

  render() {
    return (
      <View>
        {this.state.tracks.map((item, index) => {
          console.log('this.state', this.state);
          console.log('rerender ui', item, item.stream.toURL());
          return (
            <View key={index} style={{backgroundColor: 'black'}}>
              <RTCView
                objectFit={'cover'}
                streamURL={item.stream.toURL()}
                style={{
                  minHeight: 100,
                  border: '10px solid red',
                  backgroundColor: 'black',
                }}
                key={index}
                zOrder={2}
              />
            </View>
          );
        })}

        <View>
          <TextInput
            style={styles.textInput}
            // onChangeText={setRoomId}
            placeholder="room id"
            placeholderTextColor="gray"
            value={'919191'}
          />
        </View>
        <View>
          <Button onPress={() => this.connect('919191')} title="Connect" />
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'lightgray',
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    color: 'black',
  },
});
export default JitsiRTC;
