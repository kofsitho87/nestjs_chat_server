<template>
  <div class="received_withd_msg received_withd_msg_center overflow-hidden">
    {{ message.data.content }}
  </div>
</template>


<script>
export default {
  name: 'MessageOldAdmin',
  props: ['message']
}
</script>