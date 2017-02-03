Vagrant.configure("2") do |config|
  config.vm.box = "monolit/dockerhost"
  config.vm.provision "shell",
    path: "provision/development-setup-as-root"
  config.vm.provision "shell",
    privileged: false,
    path: "provision/development-setup-as-user"
  config.vm.synced_folder "src", "/vagrant", rsync__exclude: [
    ".DS_Store","node_modules"]
  config.vm.synced_folder "provision", "/provision", rsync__exclude: [
    ".DS_Store"]
  config.vm.network "forwarded_port", guest: 3000, host: 3000
end
