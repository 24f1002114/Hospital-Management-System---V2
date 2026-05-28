export default {
  template: ` 
  <div class="row wall border d-flex" style="height: 700px; overflow: auto;">
    <div class="col-12 p-4 border" style="overflow-y: auto;">
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h4 class="mb-0">Add Treatment</h4>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="saveHistory">
            <div class="row">
              
              <!-- Left Column -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Visit Type</label>
                  <select class="form-select" v-model="form.visit_type" required>
                    <option value="">Select Type</option>
                    <option>In Person</option>
                    <option>Telemedicine</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Tests Done</label>
                  <input type="text" class="form-control" v-model="form.tests_done">
                </div>

                <div class="mb-3">
                  <label class="form-label">Diagnosis</label>
                  <input type="text" class="form-control" v-model="form.diagnosis" required>
                </div>

                <div class="mb-3">
                  <label class="form-label">Prescription</label>
                  <textarea class="form-control" v-model="form.prescription" rows="6"></textarea>
                </div>
              </div>

              <!-- Right Column -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Next Visit Date</label>
                  <input type="date" class="form-control" v-model="form.next_visit_date">
                </div>

                <div class="mb-3">
                  <label class="form-label">Notes</label>
                  <textarea class="form-control" v-model="form.notes" rows="3"></textarea>
                </div>

                <!-- Medicines Section -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-2">
                    <label class="form-label mb-0">Medicines</label>
                    <button type="button" class="btn btn-sm btn-success" @click="addMedicine">
                      + Add
                    </button>
                  </div>
                  
                  <div style="max-height: 200px; overflow-y: auto;">
                    <div v-for="(med, idx) in form.medicines" :key="idx" class="card mb-2 bg-light">
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between mb-2">
                          <small class="text-muted">Medicine {{ idx + 1 }}</small>
                          <button 
                            type="button" 
                            class="btn btn-sm btn-danger" 
                            @click="removeMedicine(idx)"
                            v-if="form.medicines.length > 1">
                            Remove
                          </button>
                        </div>
                        
                        <input 
                          type="text" 
                          class="form-control form-control-sm mb-2" 
                          v-model="med.name" 
                          placeholder="Name" 
                          required>
                        <label class="form-label small mb-1">Dosage frequency (i.e., 1-0-0)</label>
                        <input class="form-control form-control-sm mb-2" v-model="med.dosage" required>
                        <input 
                          type="number" 
                          class="form-control form-control-sm" 
                          v-model.number="med.duration_days" 
                          placeholder="Days" 
                          min="1" 
                          required>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="d-flex gap-2 mt-3">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      saving: false,
      appointmentId: null,
      form: {
        visit_type: "",
        tests_done: "",
        diagnosis: "",
        prescription: "",
        notes: "",
        next_visit_date: "",
        medicines: [{ name: "", dosage: "", duration_days: 1 }]
      }
    };
  },
  created() {
    this.appointmentId = this.$route.params.id;
  },
  methods: {
    addMedicine() {
      this.form.medicines.push({ name: "", dosage: "", duration_days: 1 });
    },
    removeMedicine(index) {
      this.form.medicines.splice(index, 1);
    },
    saveHistory() {
    const invalidMed = this.form.medicines.some(m => !m.name.trim() || !m.dosage.trim() || !m.duration_days);
    if (invalidMed) {
        alert('Please fill all medicine fields!');
        return;
    }
    if (this.saving) return;
    this.saving = true;

    return authFetchWithRetry('/api/treatments', {           // ✅ authFetchWithRetry + return
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            appointment_id: this.appointmentId,
            ...this.form
        })
    })
      .then(r => {
          if (!r) throw new Error('No response');            // ✅ !r guard
          if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return; }
          if (!r.ok) throw new Error('Failed to save');
          return r.json();
      })
      .then(data => {
          if (!data) return;                                 // ✅ null guard
          alert('Saved!');
          this.goBack();
      })
      .catch(err => {
          alert('Error: ' + err.message);
      })
      .finally(() => {
          this.saving = false;
      });
  },
    goBack() {
      this.$router.go(-1);
    }
  }
};