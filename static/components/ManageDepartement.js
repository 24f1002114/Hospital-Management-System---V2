export default {
  template: `
    <div class="row border d-flex wall" style="height: 700px; overflow: auto;">
      <div class="col-12 border p-4" style="overflow-y: auto;">
        <div class="card shadow p-3 bg-white">
          
          <!-- Header -->
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Manage Departments</h5>
            <button class="btn btn-light btn-sm" @click="$router.go(-1)">Back</button>
          </div>

          <!-- Body -->
          <div class="card-body">
            <!-- Add form -->
            <div class="mb-3 border rounded p-3 bg-light">
              <h6 class="mb-2">Add Department</h6>
              <div class="row g-2">
                <div class="col-md-4">
                  <input v-model.trim="newDept.name" class="form-control" placeholder="Department name" />
                </div>
                <div class="col-md-6">
                  <input v-model.trim="newDept.description" class="form-control" placeholder="Description" />
                </div>
                <div class="col-md-2 d-flex">
                  <button class="btn btn-success w-100" @click="addDepartment" :disabled="adding">
                    {{ adding ? 'Adding...' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- List -->
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark sticky-top">
                  <tr>
                    <th style="width: 8%;">ID</th>
                    <th style="width: 24%;">Name</th>
                    <th>Description</th>
                    <th style="width: 24%;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in departments" :key="d.id">
                    <td>{{ d.id }}</td>

                    <!-- Name -->
                    <td>
                      <template v-if="d._edit">
                        <input v-model.trim="d._name" class="form-control form-control-sm" />
                      </template>
                      <template v-else>
                        {{ d.name }}
                      </template>
                    </td>

                    <!-- Description -->
                    <td>
                      <template v-if="d._edit">
                        <input v-model.trim="d._description" class="form-control form-control-sm" />
                      </template>
                      <template v-else>
                        {{ d.description }}
                      </template>
                    </td>

                    <!-- Actions -->
                    <td class="text-nowrap">
                      <div class="d-flex align-items-center gap-2">
                        <button v-if="!d._edit" class="btn btn-primary btn-sm" @click="startEdit(d)">Edit</button>
                        <button v-else class="btn btn-success btn-sm" @click="saveEdit(d)">Save</button>
                        <button v-else class="btn btn-secondary btn-sm" @click="cancelEdit(d)">Cancel</button>
                        <button class="btn btn-danger btn-sm" @click="deleteDepartment(d.id)" :disabled="deletingId===d.id">
                          {{ deletingId===d.id ? 'Deleting...' : 'Delete' }}
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!loading && departments.length === 0">
                    <td colspan="4" class="text-center">No departments found</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="text-center py-3">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>
          </div> <!-- /.card-body -->

        </div> <!-- /.card -->
      </div> <!-- /.col-12 -->
    </div> <!-- /.row -->
  `,
  data() {
    return {
      departments: [],
      loading: true,
      adding: false,
      deletingId: null,
      newDept: { name: '', description: '' }
    };
  },
  created() {
    this.loadDepartments();
  },
  methods: {
    headers() {
      return {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('auth_token')
      };
    },
    loadDepartments() {
      this.loading = true;
      fetch('/api/departments', { headers: this.headers() })
        .then(r => r.json())
        .then(list => {
          this.departments = Array.isArray(list) ? list.map(d => ({ ...d, _edit: false })) : [];
        })
        .catch(() => {
          alert('Failed to load departments');
          this.departments = [];
        })
        .finally(() => (this.loading = false));
    },
    addDepartment() {
      if (!this.newDept.name || !this.newDept.description) {
        alert('Name and description are required');
        return;
      }
      this.adding = true;
      fetch('/api/departments', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          name: this.newDept.name,
          description: this.newDept.description
        })
      })
        .then(async r => {
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.message || 'Add failed');
          this.newDept = { name: '', description: '' };
          this.loadDepartments();
        })
        .catch(err => alert(err.message))
        .finally(() => (this.adding = false));
    },
    startEdit(d) {
      d._edit = true;
      d._name = d.name;
      d._description = d.description;
    },
    cancelEdit(d) {
      d._edit = false;
      delete d._name;
      delete d._description;
    },
    saveEdit(d) {
      const payload = {};
      if (d._name !== d.name) payload.name = d._name;
      if (d._description !== d.description) payload.description = d._description;

      if (Object.keys(payload).length === 0) {
        this.cancelEdit(d);
        return;
      }

      fetch(`/api/department/${d.id}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(payload)
      })
        .then(async r => {
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.message || 'Update failed');
          d.name = d._name;
          d.description = d._description;
          this.cancelEdit(d);
        })
        .catch(err => alert(err.message));
    },
    deleteDepartment(id) {
      if (!confirm('Delete this department?')) return;
      this.deletingId = id;
      fetch(`/api/department/${id}`, {
        method: 'DELETE',
        headers: this.headers()
      })
        .then(async r => {
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.message || 'Delete failed');
          this.departments = this.departments.filter(d => d.id !== id);
        })
        .catch(err => alert(err.message))
        .finally(() => (this.deletingId = null));
    }
  }
};